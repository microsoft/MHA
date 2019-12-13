const fs = require("fs");
const path = require("path");

function purge(files, sourcePath) {
    for (const file of files) {
        console.log("Considering " + file);
        if (file.match(/aikey\.js/)) continue;
        if (file.match(/\.js/)) {
            console.log("  Deleting " + file);
            const filePath = path.join(sourcePath, file);
            fs.unlinkSync(filePath);
        }
    }
}

const scriptsFolder = path.join(__dirname, "..", "Scripts");
const files = fs.readdirSync(scriptsFolder);
purge(files, scriptsFolder);
const utFolder = path.join(__dirname, "..", "Scripts", "unittests");
const ut = fs.readdirSync(utFolder);
purge(ut, utFolder);