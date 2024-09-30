// @ts-expect-error Variable replacement from DefinePlugin
export const buildTime = function ():string { return __BUILDTIME__; };
