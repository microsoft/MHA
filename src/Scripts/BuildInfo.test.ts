import { getBuildInfo, getCommitUrl, isLocalBuild } from "./BuildInfo";

describe("BuildInfo", () => {
    const testCommit = "0".repeat(40);

    test("returns the injected build metadata", () => {
        expect(getBuildInfo()).toEqual({
            buildNumber: "local",
            commit: testCommit,
            builtAt: "1970-01-01T00:00:00.000Z"
        });
    });

    test("builds the GitHub commit URL from the full SHA", () => {
        expect(getCommitUrl()).toBe(`https://github.com/microsoft/MHA/commit/${testCommit}`);
    });

    test("identifies local builds", () => {
        expect(isLocalBuild()).toBe(true);
    });
});