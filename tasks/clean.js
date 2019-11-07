const fs = require("fs");
const path = require("path");

const scriptsFolder = path.join(__dirname, "..", "Scripts");

const files = fs.readdirSync(scriptsFolder);
for (const file of files) {
    console.log("Considering " + file);
    if (file.match(/\.min\.js/)) {
        console.log("  Deleting " + file);
        const filePath = path.join(scriptsFolder, file);
        fs.unlinkSync(filePath);
    }
}
