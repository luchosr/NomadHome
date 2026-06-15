import { createBrowserRouter } from "react-router-dom";
import { App } from "./App.js";

/**
 * Route table. Role-guarded groups (`/host`, `/admin`) are placeholders here;
 * capability tickets attach real guards and pages. Admin lives behind guarded
 * routes in `apps/web` — there is no separate admin app for the MVP
 * (openspec/project.md §5).
 */
export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/host/*", element: <App /> },
  { path: "/admin/*", element: <App /> },
]);
