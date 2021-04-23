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

// Remove build output directories
rmdir(path.join(__dirname, "..", "Pages"));
rmdir(path.join(__dirname, "..", "Content"));
rmdir(path.join(__dirname, "..", "src", "transpiled"));

// We don't remove Scripts, but instead remove child directories of Scripts
const scriptsFolder = path.join(__dirname, "..", "Scripts");
if (fs.existsSync(scriptsFolder)) {
    fs.readdirSync(scriptsFolder).forEach((file, index) => {
        const subpath = path.join(scriptsFolder, file);
        if (fs.lstatSync(subpath).isDirectory()) {
            rmdir(subpath);
        }
    });
}