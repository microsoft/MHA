const fs = require("fs");
const path = require("path");

const distFolder = path.join(__dirname, "..", "dist");

const files = fs.readdirSync(distFolder);
for (const file of files) {
    const filePath = path.join(distFolder, file);
    fs.unlinkSync(filePath);
}
