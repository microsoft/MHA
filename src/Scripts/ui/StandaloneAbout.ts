import { getBuildInfo, getCommitUrl, isLocalBuild } from "../BuildInfo";

interface FluentDialog extends HTMLElement {
    show(): void;
    hide(): void;
}

export function initializeStandaloneAbout(): void {
    const dialog = document.getElementById("aboutDialog") as FluentDialog;
    const aboutButton = document.getElementById("aboutButton") as HTMLButtonElement;
    const closeButton = document.getElementById("aboutCloseButton") as HTMLButtonElement;
    const buildElement = document.getElementById("aboutBuild") as HTMLElement;
    const commitLabel = document.getElementById("aboutCommitLabel") as HTMLElement | null;
    const commitLink = document.getElementById("aboutCommit") as HTMLAnchorElement;
    const builtAtElement = document.getElementById("aboutBuiltAt") as HTMLTimeElement;
    const buildInfo = getBuildInfo();

    buildElement.textContent = isLocalBuild() ? "Local" : buildInfo.buildNumber;
    if (commitLabel) commitLabel.textContent = isLocalBuild() ? "Base commit" : "Commit";
    commitLink.textContent = buildInfo.commit;
    commitLink.href = getCommitUrl();
    builtAtElement.textContent = buildInfo.builtAt;
    builtAtElement.dateTime = buildInfo.builtAt;
    dialog.hidden = false;

    aboutButton.onclick = (): void => dialog.show();
    closeButton.onclick = (): void => dialog.hide();
    dialog.addEventListener("click", (event: Event): void => {
        if (event.target === dialog) dialog.hide();
    });
}