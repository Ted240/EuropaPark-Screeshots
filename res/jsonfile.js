const fs = require("fs");

class JSONFile {
    constructor(path) {
        this.path = path;
        this.content = {};
        this.read();
    }

    read() {
        if (fs.existsSync(this.path)) {
            this.content = JSON.parse(fs.readFileSync(this.path).toString());
        } else {
            this.content = {};
            this.save();
        }
    }

    save() {
        fs.writeFileSync(this.path, JSON.stringify(this.content, null, 2));
    }
}

exports.JSONFile = JSONFile;