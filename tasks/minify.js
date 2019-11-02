const UglifyJS = require("uglify-js");
const fs = require("fs");
const path = require("path");

const scriptsFolder = path.join(__dirname, "..", "Scripts");
const distFolder = path.join(__dirname, "..", "dist");

// Ensure dist directory exists
if (!fs.existsSync(distFolder)) {
    fs.mkdirSync(distFolder);
}

var options = {
    compress: {},
    mangle: {}
};

const targets = {
    "mha.js": [
        "StandAlone.js",
        "Headers.js",
        "Table.js",
        "Strings.js",
        "Received.js",
        "Other.js",
        "ForefrontAntispam.js",
        "Antispam.js",
        "Summary.js",
        "2047.js",
    ],
    "classicDesktopFrame.js": [
        "Headers.js",
        "Received.js",
        "Other.js",
        "ForefrontAntispam.js",
        "Antispam.js",
        "Summary.js",
        "Table.js",
        "Strings.js",
        "2047.js",
        "Default.js",
    ],
};

for (const targetName of Object.keys(targets)) {

    const fileSet = targets[targetName];

    // Create the list of files and read their sources
    const files = {};
    for (const file of fileSet) {
        files[file] = fs.readFileSync(path.join(scriptsFolder, file), "utf8");
    }

    fs.writeFileSync(path.join(distFolder, targetName), UglifyJS.minify(files, options).code, "utf8");
}