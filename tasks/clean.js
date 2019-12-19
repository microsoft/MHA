const fs = require("fs");
const path = require("path");

const rmdir = function (filepath) {
    if (fs.existsSync(filepath)) {
        fs.readdirSync(filepath).forEach((file, index) => {
            const subpath = path.join(filepath, file);
            if (fs.lstatSync(subpath).isDirectory()) {
                rmdir(subpath);
            } else {
                fs.unlinkSync(subpath);
            }
        });

        console.log("Deleting " + filepath);
        fs.rmdirSync(filepath);
    }
};

const pagesFolder = path.join(__dirname, "..", "Pages");
rmdir(pagesFolder);

const scriptsFolder = path.join(__dirname, "..", "Scripts");
fs.readdirSync(scriptsFolder).forEach((file, index) => {
    const subpath = path.join(scriptsFolder, file);
    if (fs.lstatSync(subpath).isDirectory()) {
        rmdir(subpath);
    }
});