import { createBrowserRouter } from "react-router";
import { WorkbenchPage } from "@/features/review-workspace/WorkbenchPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <WorkbenchPage />,
  },
]);
