export interface BuildInfo {
    readonly buildNumber: string;
    readonly commit: string;
    readonly builtAt: string;
}

export function getBuildInfo(): BuildInfo {
    return mhaBuildInfo;
}

export function getCommitUrl(): string {
    return `https://github.com/microsoft/MHA/commit/${getBuildInfo().commit}`;
}

export function isLocalBuild(): boolean {
    return getBuildInfo().buildNumber === "local";
}