import { createHashRouter } from "react-router";
import { Root } from "./Root";
import { AetherLanding } from "./pages/AetherLanding";
import { Dashboard } from "./pages/Dashboard";
import { RoomAnalysis } from "./pages/RoomAnalysis";
import { BiVariateAnalysis } from "./pages/BiVariateAnalysis";
import { Settings } from "./pages/Settings";

export const router = createHashRouter([
  {
    path: "/",
    Component: AetherLanding,
  },
  {
    path: "/dashboard",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "room-analysis", Component: RoomAnalysis },
      { path: "bivariate-analysis", Component: BiVariateAnalysis },
      { path: "settings", Component: Settings },
      { path: "*", Component: Dashboard }, // fallback
    ],
  },
]);