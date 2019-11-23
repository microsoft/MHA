const process = require("process");
console.log("key found in env: " + process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
const key = process.env.APPINSIGHTS_INSTRUMENTATIONKEY ? process.env.APPINSIGHTS_INSTRUMENTATIONKEY : "2f12afed-6139-456e-9de3-49003d3a1fb1";
const fs = require("fs");
const path = require("path");
const scriptsFolder = path.join(__dirname, "..", "Scripts");
const aiscript = path.join(scriptsFolder, "aikey.js");

console.log("Merging AppInsights key (" + key + ") into js");
if (fs.existsSync(aiscript)) {
    console.log("  Deleting " + aiscript);
    fs.unlinkSync(aiscript);
}

console.log("Building " + aiscript);
fs.writeFileSync(aiscript, "/* exported aikey */ window.aikey = function () { return \"" + key + "\"; };", "utf8");
