import { initializeStandaloneAbout } from "./StandaloneAbout";

describe("StandaloneAbout", () => {
    test("renders local build metadata and opens and closes the dialog", () => {
        document.body.innerHTML = `
            <button id="aboutButton"></button>
            <div id="aboutDialog" hidden>
                <span id="aboutBuild"></span>
                <a id="aboutCommit"></a>
                <time id="aboutBuiltAt"></time>
                <button id="aboutCloseButton"></button>
            </div>`;

        const dialog = document.getElementById("aboutDialog") as HTMLDivElement & { show: jest.Mock; hide: jest.Mock };
        dialog.show = jest.fn();
        dialog.hide = jest.fn();

        initializeStandaloneAbout();

        expect(document.getElementById("aboutBuild")?.textContent).toBe("Local");
        expect(document.getElementById("aboutCommit")?.textContent).toBe("0".repeat(40));
        expect((document.getElementById("aboutCommit") as HTMLAnchorElement).href)
            .toBe(`https://github.com/microsoft/MHA/commit/${"0".repeat(40)}`);
        expect(document.getElementById("aboutBuiltAt")?.textContent).toBe("1970-01-01T00:00:00.000Z");
        expect(dialog.hidden).toBe(false);

        document.getElementById("aboutButton")?.click();
        expect(dialog.show).toHaveBeenCalledTimes(1);

        document.getElementById("aboutCloseButton")?.click();
        expect(dialog.hide).toHaveBeenCalledTimes(1);
    });
});