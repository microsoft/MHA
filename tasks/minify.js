const UglifyJS = require("uglify-js");
const fs = require("fs");
const path = require("path");

const scriptsFolder = path.join(__dirname, "..", "Scripts");

var options = {
    compress: {},
    mangle: {},
    sourceMap: {}
};

const targets = {
    "2047.min.js": ["2047.js"],
    "Antispam.min.js": ["Antispam.js"],
    "Default.min.js": ["Default.js"],
    "DesktopPane.min.js": ["DesktopPane.js"],
    "Errors.min.js": ["Errors.js"],
    "ForefrontAntispam.min.js": ["ForefrontAntispam.js"],
    "Functions.min.js": ["Functions.js"],
    "GetHeaders.min.js": ["GetHeaders.js"],
    "GetHeadersEWS.min.js": ["GetHeadersEWS.js"],
    "GetHeadersRest.min.js": ["GetHeadersRest.js"],
    "Headers.min.js": ["Headers.js"],
    "MobilePane-ios.min.js": ["MobilePane-ios.js"],
    "MobilePane.min.js": ["MobilePane.js"],
    "Other.min.js": ["Other.js"],
    "Received.min.js": ["Received.js"],
    "siteTypesOffice.min.js": ["siteTypesOffice.js"],
    "StandAlone.min.js": ["StandAlone.js"],
    "Strings.min.js": ["Strings.js"],
    "Summary.min.js": ["Summary.js"],
    "Table.min.js": ["Table.js"],
    "uiToggle.min.js": ["uiToggle.js"],
    "diag.min.js": ["diag.js"]
};

for (const targetName of Object.keys(targets)) {
    const fileSet = targets[targetName];
    const mapName = targetName + ".map";
    console.log("Building " + targetName + " and " + mapName);

    // Create the list of files and read their sources
    const files = {};
    for (const file of fileSet) {
        files[file] = fs.readFileSync(path.join(scriptsFolder, file), "utf8");
    }

    options.sourceMap.filename = targetName;
    options.sourceMap.url = mapName;
    options.sourceMap.root = "..//scripts";
    var result = UglifyJS.minify(files, options);
    fs.writeFileSync(path.join(scriptsFolder, targetName), result.code, "utf8");
    fs.writeFileSync(path.join(scriptsFolder, mapName), result.map, "utf8");
}