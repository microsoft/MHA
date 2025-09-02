import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
