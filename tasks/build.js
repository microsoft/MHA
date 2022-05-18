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

// Simple stupid hash to reduce commit ID to something short
const getHash = function (str) {
    var hash = 42;
    if (str.length) { for (var i = 0; i < str.length; i++) { hash = Math.abs((hash << 5) - hash + str.charCodeAt(i)); } }
    return hash.toString(16);
};

var commitID = process.env.SCM_COMMIT_ID;
if (!commitID) commitID = "test";
const version = getHash(commitID);
console.log("commitID: " + commitID);
console.log("version: " + version);

// Copy files from src to dst, replacing %version% on the way if munge is true
const deploy = function (src, dst, munge) {
    console.log("Copying from " + src + " to " + dst);
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });

    const srcFiles = fs.readdirSync(src);
    for (const srcFile of srcFiles) {
        var srcPath = path.join(src, srcFile);
        var dstPath = path.join(dst, srcFile);

        console.log("   Copying from " + srcPath + " to " + dstPath);

        var fileBytes = fs.readFileSync(srcPath, "utf8");
        if (munge) fileBytes = fileBytes.replace(/%version%/g, version);
        fs.writeFileSync(dstPath, fileBytes, "utf8");
    }
};

console.log("Deploying pages");
deploy(path.join(__dirname, "..", "src", "Pages"), path.join(__dirname, "..", "Pages"), true);

console.log("Deploying css");
var contentPath = path.join(__dirname, "..", "Content")
if (!fs.existsSync(contentPath)) fs.mkdirSync(contentPath, { recursive: true });
deploy(path.join(__dirname, "..", "src", "Content"), path.join(contentPath, version), false);

var options = {
    compress: {},
    mangle: {},
    sourceMap: {}
};

const targets = {
    "2047.min.js": ["2047.js"],
    "Antispam.min.js": ["Antispam.js"],
    "Dates.min.js": ["Dates.js"],
    "Default.min.js": ["Default.js"],
    "DesktopPane.min.js": ["DesktopPane.js"],
    "Errors.min.js": ["Errors.js"],
    "ForefrontAntispam.min.js": ["ForefrontAntispam.js"],
    "GetHeaders.min.js": ["GetHeaders.js"],
    "GetHeadersEWS.min.js": ["GetHeadersEWS.js"],
    "GetHeadersRest.min.js": ["GetHeadersRest.js"],
    "Headers.min.js": ["Headers.js"],
    "MobilePane-ios.min.js": ["MobilePane-ios.js"],
    "MobilePane.min.js": ["MobilePane.js"],
    "Other.min.js": ["Other.js"],
    "poster.min.js": ["poster.js"],
    "Received.min.js": ["Received.js"],
    "siteTypesOffice.min.js": ["siteTypesOffice.js"],
    "StandAlone.min.js": ["StandAlone.js"],
    "Strings.min.js": ["Strings.js"],
    "Summary.min.js": ["Summary.js"],
    "Table.min.js": ["Table.js"],
    "uiToggle.min.js": ["uiToggle.js"],
    "diag.min.js": ["diag.js"],
    "unittests/ut-common.min.js": ["unittests/ut-common.js"],
    "unittests/ut-2047.min.js": ["unittests/ut-2047.js"],
    "unittests/ut-antispam.min.js": ["unittests/ut-antispam.js"],
    "unittests/ut-DateTime.min.js": ["unittests/ut-DateTime.js"],
    "unittests/ut-GetHeaderList.min.js": ["unittests/ut-GetHeaderList.js"],
    "unittests/ut-ParseError.min.js": ["unittests/ut-ParseError.js"],
    "unittests/ut-parseHeaders.min.js": ["unittests/ut-parseHeaders.js"],
    "unittests/ut-Received.min.js": ["unittests/ut-Received.js"],
    "unittests/ut-XML.min.js": ["unittests/ut-XML.js"]
};

console.log("Deploying script");
const scriptsFolderSrc = path.join(__dirname, "..", "src", "transpiled");
const scriptsFolderDstRoot = path.join(__dirname, "..", "Scripts");
const scriptsFolderDst = path.join(scriptsFolderDstRoot, version);

if (!fs.existsSync(scriptsFolderDstRoot)) {
    fs.mkdirSync(scriptsFolderDstRoot);
}

for (const targetName of Object.keys(targets)) {
    const fileSet = targets[targetName];
    const mapName = targetName + ".map";
    console.log("   Building " + targetName + " and " + mapName);

    // Create the list of files and read their sources
    const files = {};
    for (const file of fileSet) {
        const fileName = path.basename(file);
        files[fileName] = fs.readFileSync(path.join(scriptsFolderSrc, file), "utf8");
        // Copy original over verbatim to the target directory
        const dstPathOrig = path.join(scriptsFolderDst, file);
        const dstDir = path.dirname(dstPathOrig);
        if (!fs.existsSync(dstDir)) {
            fs.mkdirSync(dstDir);
        }

        fs.writeFileSync(dstPathOrig, files[fileName], "utf8");
        if (debug) {
            // Copy min over to the target directory
            const dstPathMin = path.join(scriptsFolderDst, targetName);
            fs.writeFileSync(dstPathMin, files[fileName], "utf8");
        }
    }

    options.sourceMap.filename = path.basename(targetName);
    options.sourceMap.url = path.basename(mapName);
    const result = UglifyJS.minify(files, options);
    if (result.error) {
        console.log("         result.error " + result.error);
        throw new Error(result.error);
    }

    if (result.warnings) {
        console.log("         result.warnings" + result.warnings);
    }

    if (!debug) {
        fs.writeFileSync(path.join(scriptsFolderDst, targetName), result.code, "utf8");
        fs.writeFileSync(path.join(scriptsFolderDst, mapName), result.map, "utf8");
    }
}

if (version) {
    const versionscript = path.join(scriptsFolderDst, "version.js");

    console.log("Merging version (" + version + ") into js");
    if (fs.existsSync(versionscript)) {
        console.log("  Deleting " + versionscript);
        fs.unlinkSync(versionscript);
    }

    console.log("Building " + versionscript);
    fs.writeFileSync(versionscript, "/* exported mhaVersion */ window.mhaVersion = function () { return \"" + version + "\"; };", "utf8");
}
