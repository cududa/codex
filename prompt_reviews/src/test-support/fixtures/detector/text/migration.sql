CREATE TABLE thread_goals (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL
);

CREATE TABLE turn_context_items (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL
);
