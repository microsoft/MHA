const UglifyJS = require("uglify-js");
const fs = require("fs");
const path = require("path");

const scriptsFolder = path.join(__dirname, "..", "Scripts");
const distFolder = path.join(__dirname, "..", "dist");
const unittestsFolder = path.join(__dirname, "..", "dist", "unittests");


// Ensure directories exist
if (!fs.existsSync(distFolder)) {
    fs.mkdirSync(distFolder);
}

if (!fs.existsSync(unittestsFolder)) {
    fs.mkdirSync(unittestsFolder);
}

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
    "unittests/ut-2047.min.js": ["unittests/ut-2047.js"],
    "unittests/ut-DateTime.min.js": ["unittests/ut-DateTime.js"],
    "unittests/ut-GetHeaderList.min.js": ["unittests/ut-GetHeaderList.js"],
    "unittests/ut-Received.min.js": ["unittests/ut-Received.js"],
    "unittests/ut-ParseError.min.js": ["unittests/ut-ParseError.js"],
    "unittests/ut-Xml.min.js": ["unittests/ut-Xml.js"]
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
    var result = UglifyJS.minify(files, options);
    fs.writeFileSync(path.join(distFolder, targetName), result.code, "utf8");
    fs.writeFileSync(path.join(distFolder, mapName), result.map, "utf8");
}