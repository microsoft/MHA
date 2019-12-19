const UglifyJS = require("uglify-js");
const fs = require("fs");
const path = require("path");
const process = require("process");

const args = process.argv.slice(2);
const debug = args[0] && args[0] === "debug";
console.log('debug = ' + debug);

const key = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
if (key) {
    console.log("key found in env: " + key);
    const scriptsFolder = path.join(__dirname, "..", "Scripts");
    const aiscript = path.join(scriptsFolder, "aikey.js");

    console.log("Merging AppInsights key (" + key + ") into js");
    if (fs.existsSync(aiscript)) {
        console.log("  Deleting " + aiscript);
        fs.unlinkSync(aiscript);
    }

    console.log("Building " + aiscript);
    fs.writeFileSync(aiscript, "/* exported aikey */ window.aikey = function () { return \"" + key + "\"; };", "utf8");
} else {
    console.log("No key found - skipping aikey.js generation");
}

// TODO: come up with a proper version here
const version = "test";

const scriptsFolderSrc = path.join(__dirname, "..", "src", "Scripts");
const scriptsFolderDst = path.join(__dirname, "..", "Scripts", version);
const pagesFolderSrc = path.join(__dirname, "..", "src", "Pages");
const pagesFolderDst = path.join(__dirname, "..", "Pages");

// Copy pages from pagesFolderSrc to pagesFolderDst, replacing %version% on the way
if (!fs.existsSync(pagesFolderDst)) {
    fs.mkdirSync(pagesFolderDst);
}

console.log("Updating pages");
console.log("Copying from " + pagesFolderSrc);
console.log("Copying to " + pagesFolderDst);
const pageFiles = fs.readdirSync(pagesFolderSrc);
for (const pageFile of pageFiles) {
    console.log("Considering " + pageFile);
    var srcPath = path.join(pagesFolderSrc, pageFile);
    var dstPath = path.join(pagesFolderDst, pageFile);

    console.log("Copying from " + srcPath);
    console.log("Copying to " + dstPath);

    var fileBytes = fs.readFileSync(srcPath, "utf8");
    fs.writeFileSync(dstPath, fileBytes.replace(/%version%/g, version), "utf8");
}

var options = {
    compress: {},
    mangle: {},
    sourceMap: {}
};
options.sourceMap.root = path.join("..", "Scripts", version);

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
    "diag.min.js": ["diag.js"],
    "unittests/ut-2047.min.js": ["unittests/ut-2047.js"],
    "unittests/ut-DateTime.min.js": ["unittests/ut-DateTime.js"],
    "unittests/ut-GetHeaderList.min.js": ["unittests/ut-GetHeaderList.js"],
    "unittests/ut-ParseError.min.js": ["unittests/ut-ParseError.js"],
    "unittests/ut-Received.min.js": ["unittests/ut-Received.js"],
    "unittests/ut-XML.min.js": ["unittests/ut-XML.js"]
};

for (const targetName of Object.keys(targets)) {
    const fileSet = targets[targetName];
    const mapName = targetName + ".map";
    console.log("Building " + targetName + " and " + mapName);

    // Create the list of files and read their sources
    const files = {};
    for (const file of fileSet) {
        files[file] = fs.readFileSync(path.join(scriptsFolderSrc, file), "utf8");
        // Copy original over verbatim to the target directory
        const dstPathOrig = path.join(scriptsFolderDst, file);
        const dstDir = path.dirname(dstPathOrig);
        if (!fs.existsSync(dstDir)) {
            fs.mkdirSync(dstDir);
        }
        fs.writeFileSync(dstPathOrig, files[file], "utf8");
        if (debug) {
            // Copy min over to the target directory
            const dstPathMin = path.join(scriptsFolderDst, targetName);
            fs.writeFileSync(dstPathMin, files[file], "utf8");
        }
    }

    if (!debug) {
        options.sourceMap.filename = targetName;
        options.sourceMap.url = mapName;
        var result = UglifyJS.minify(files, options);
        fs.writeFileSync(path.join(scriptsFolderDst, targetName), result.code, "utf8");
        fs.writeFileSync(path.join(scriptsFolderDst, mapName), result.map, "utf8");
    }
}
