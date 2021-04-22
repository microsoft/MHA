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

rmdir(path.join(__dirname, "..", "Pages"));
rmdir(path.join(__dirname, "..", "Content"));
rmdir(path.join(__dirname, "..", "Scripts"));