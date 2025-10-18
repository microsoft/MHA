//Build/Manage main UI for classic desktop pane

// Import CSS - Include base styles needed for classic frame
import "../../Content/Office.css";
import "../../Content/classicDesktopFrame.css";

// For now, import the same logic as newDesktopFrame
// TODO: This could be separated into classic-specific implementation later
export * from "./newDesktopFrame";

// The main newDesktopFrame module will handle the initialization
// This allows both classic and new frames to work with the same codebase
// while preserving the separate file structure that main expects