import { createBrowserRouter } from "react-router";
import { ReviewWorkspacePage } from "@/features/review-workspace/ReviewWorkspacePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ReviewWorkspacePage />,
  },
]);
