// const axios = require("axios")
const express = require("express")
// const jimp = require("jimp")
const config = require("./config.json")

const auth = require("./auth");
const api = require("./api");

const app = express();
app.use(express.json())

auth.loadTokens(config.auth.token_file)

/**
 * Main router
 * → Basic authentication
 */
app.use((req, res, next) => {
    try {
        /** Authentication **/
        if (!config.auth.enable) next(); // Auth disabled
        else if (["/", "/status", "/view"].includes(req.path)) next(); // Asking for free access endpoint
        else {

            // Token grabbing
            let token;
            // Payload token case
            if (req.method === "POST" && req.body["authorization"] !== undefined) token = req.body["authorization"];
            // Header token case
            if (req.header("authorization") !== undefined) token = req.header("authorization");
            // Compare with db
            if (auth.isValidToken(token)) {
                next();
            } else {
                res.status(403).json({err: "Bad token given"});
            }
        }
    } catch (e) {
        /** Default error **/
        if (!res.headersSent) res.status(500).json({err: "An unexpected error occurred", details: e});
    }
    /** Default response **/
    if (!res.headersSent) res.status(200).json({state: "Automatically generated response, all went fine"});

});

Object.entries(api.endpoints).forEach(([name, data]) => {
    try {
        if (Object.keys(data.types).includes("get")) app.get(data.path, api.build_endpoint_func(data.types.get, data.func));
        if (Object.keys(data.types).includes("post")) app.post(data.path, api.build_endpoint_func(data.types.post, data.func));
        console.log(`[S] Endpoint '${name}' has been loaded`);
    } catch (e) {
        console.log(`[W] Endpoint '${name}' cannot be loaded\n${e}`);
    }
});

app.listen(config.server.port, () => {
    console.log(`Server running at http://127.0.0.1:${config.server.port}`)
})