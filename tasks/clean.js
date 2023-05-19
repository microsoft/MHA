const fs = require("fs");
const path = require("path");

const rmdir = function (filepath) {
    if (fs.existsSync(filepath)) {
        fs.readdirSync(filepath).forEach((file) => {
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
rmdir(path.join(__dirname, "..", "Resources"));
