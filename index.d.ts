declare module "*.png";
declare module "*.jpg";
declare module "*.css";

declare const mhaBuildInfo: Readonly<{
	buildNumber: string;
	commit: string;
	builtAt: string;
}>;
