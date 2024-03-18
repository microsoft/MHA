import "framework7";
// Framework7 currently has full support for ES modules
// However, we're using an old version of Framework7 which does not export
// It instead adds Framework7 to window as a side effect
// So we do a naked import and then export it from here so the rest of our code can treat
// it as a regular module.
// @ts-ignore
export const Framework7 = window.Framework7;
