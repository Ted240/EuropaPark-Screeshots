const fs = require("fs");

const default_user = {
    name: "Default user",
    disabled: true,
    perms: ["view", "generate"]
}

let auth = {};
let tokens = [];

const generateToken = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz1234567890";
    let _return = "";
    for (let i = 0; i < 64; i++) {
        _return += chars[Math.floor(Math.random() * chars.length)][Math.random() < 0.5 ? "toLowerCase" : "toUpperCase"]();
    }
    _return += Date.now();
    return _return;
}

const isWeak = (token) => {
    let weakPoints = [];
    // Too short token
    if (token.length <= 12) weakPoints.push("too short");

    // Too few characters
    if (((_t) => {
        let _chars = [];
        [..._t].forEach((_c) => {
            if (!_chars.includes(_c)) _chars.push(_c);
        });
        return _chars.length;
    })(token) < 20) weakPoints.push("too few chars");
    return weakPoints;
}

/**
 * Load token file
 * @param file {string} Path to file to load
 */
exports.loadTokens = (file) => {
    /** Checking if file exists, else creating one **/
    if (!fs.existsSync(`${__dirname}\\${file}`)) {
        console.log(`${file} does not exist, creating one...`);
        const def_token = generateToken();
        const data = {};
        data[def_token] = {...default_user};
        console.log(`${file} created, default token is: \n${def_token}`);
        fs.writeFileSync(`${__dirname}\\${file}`, JSON.stringify(data, null, 4));
    }

    /** Patching token file **/
    // TODO

    /** Registering auth data **/
    auth = require(`./${file}`);
    tokens = Object.keys(auth);

    /** Weak tokens **/
    tokens.forEach((t) => {
        let weaknesses = isWeak(t);
        if (weaknesses.length) console.log(`${auth[t].name}'s token seems to be weak, consider regenerate it. (Weak points: ${weaknesses.join(", ")})`)
    });
};

/**
 * Check if a token is valid
 * @param token {string} Token to check
 */
exports.isValidToken = (token) => {
    return tokens.includes(token);
};