#![allow(clippy::unwrap_used)]

use std::collections::HashMap;

use codex_core::ExternalGoalPreviousStatus;
use codex_core::ExternalGoalSet;
use codex_features::Feature;
use codex_protocol::protocol::EventMsg;
use codex_protocol::protocol::Op;
use codex_protocol::request_user_input::RequestUserInputAnswer;
use codex_protocol::request_user_input::RequestUserInputResponse;
use codex_protocol::user_input::UserInput;
use core_test_support::responses;
use core_test_support::responses::ev_assistant_message;
use core_test_support::responses::ev_completed;
use core_test_support::responses::ev_function_call;
use core_test_support::responses::ev_response_created;
use core_test_support::responses::sse;
use core_test_support::responses::start_mock_server;
use core_test_support::skip_if_no_network;
use core_test_support::test_codex::test_codex;
use core_test_support::wait_for_event_match;

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn external_objective_change_reaches_final_request_with_default_developer_role()
-> anyhow::Result<()> {
    skip_if_no_network!(Ok(()));

    let server = start_mock_server().await;
    let mut builder = test_codex().with_config(|config| {
        config
            .features
            .enable(Feature::Goals)
            .expect("goal mode should be enableable in tests");
        config
            .features
            .enable(Feature::DefaultModeRequestUserInput)
            .expect("default-mode request_user_input should be enableable in tests");
    });
    let test = builder.build(&server).await?;
    let request_user_input_args = serde_json::json!({
        "questions": [{
            "header": "Next",
            "id": "next_step",
            "question": "Pick one",
            "options": [{
                "label": "Summarize",
                "description": "Write the summary."
            }, {
                "label": "Outline",
                "description": "Write an outline."
            }]
        }]
    })
    .to_string();
    let responses = responses::mount_sse_sequence(
        &server,
        vec![
            sse(vec![
                ev_response_created("resp-1"),
                ev_function_call(
                    "call-create-goal",
                    "create_goal",
                    r#"{"objective":"Keep improving the benchmark","token_budget":1000}"#,
                ),
                ev_completed("resp-1"),
            ]),
            sse(vec![
                ev_response_created("resp-2"),
                ev_function_call(
                    "call-ask-user",
                    "request_user_input",
                    &request_user_input_args,
                ),
                ev_completed("resp-2"),
            ]),
            sse(vec![
                ev_assistant_message("msg-1", "Updated goal acknowledged."),
                ev_completed("resp-3"),
            ]),
        ],
    )
    .await;

    test.codex
        .submit(Op::UserInput {
            items: vec![UserInput::Text {
                text: "Keep improving the benchmark".into(),
                text_elements: Vec::new(),
            }],
            environments: None,
            final_output_json_schema: None,
            responsesapi_client_metadata: None,
            additional_context: Default::default(),
            thread_settings: Default::default(),
        })
        .await?;

    let request_user_input_event = wait_for_event_match(&test.codex, |event| match event {
        EventMsg::RequestUserInput(event) => Some(event.clone()),
        _ => None,
    })
    .await;

    test.codex.prepare_external_goal_mutation().await;
    let state_db = codex_state::StateRuntime::init(
        test.config.sqlite_home.clone(),
        test.config.model_provider_id.clone(),
    )
    .await?;
    let previous_goal = state_db
        .thread_goals()
        .get_thread_goal(test.session_configured.thread_id)
        .await?
        .expect("goal should be persisted");
    let updated_goal = state_db
        .thread_goals()
        .update_thread_goal(
            test.session_configured.thread_id,
            codex_state::GoalUpdate {
                objective: Some("Write a concise benchmark summary".to_string()),
                status: None,
                token_budget: None,
                expected_goal_id: Some(previous_goal.goal_id.clone()),
            },
        )
        .await?
        .expect("goal objective update should succeed");
    test.codex
        .apply_external_goal_set(ExternalGoalSet {
            goal: updated_goal,
            previous_status: ExternalGoalPreviousStatus::from(&previous_goal),
        })
        .await;

    test.codex
        .submit(Op::UserInputAnswer {
            id: request_user_input_event.turn_id,
            response: RequestUserInputResponse {
                answers: HashMap::from([(
                    "next_step".to_string(),
                    RequestUserInputAnswer {
                        answers: vec!["Summarize".to_string()],
                    },
                )]),
            },
        })
        .await?;

    wait_for_event_match(&test.codex, |event| {
        matches!(event, EventMsg::TurnComplete(_)).then_some(())
    })
    .await;

    let requests = responses.requests();
    let objective_request = requests
        .iter()
        .find(|request| request.body_contains_text("The active thread goal objective was edited"))
        .expect("objective-updated steering should reach a model request");
    let developer_goal_contexts = objective_request
        .message_input_texts("developer")
        .into_iter()
        .filter(|text| {
            let normalized_text = text.replace("\r\n", "\n");
            normalized_text.starts_with("<goal_context>")
                && normalized_text.trim_end().ends_with("</goal_context>")
        })
        .collect::<Vec<_>>();
    assert!(
        developer_goal_contexts.iter().any(|text| {
            let normalized_text = text.replace("\r\n", "\n");
            normalized_text.contains("The active thread goal objective was edited")
                && normalized_text.contains("Work from the sources that are authoritative")
                && normalized_text.contains(
                    "<untrusted_objective>\nWrite a concise benchmark summary\n</untrusted_objective>",
                )
        }),
        "expected developer-role objective-updated goal context, got {developer_goal_contexts:?}"
    );
    assert!(
        !objective_request
            .message_input_texts("user")
            .iter()
            .any(|text| text.contains("The active thread goal objective was edited")),
        "default objective-updated steering should not be user-role"
    );

    Ok(())
}
