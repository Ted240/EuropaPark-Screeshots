const {Request, Response} = require("express");
const axios = require("axios");
// const {JSONFile} = require("./jsonfile");

/**
 * @param req {Request}
 * @param res {Response}
 * @param next {CallableFunction}
 */
const default_next = (req, res, next) => { return next(req, res); };

/**
 * Return combined endpoint functions
 *
 * @param general_func {CallableFunction} General function ( = endpoint.func )
 * @param base_func {CallableFunction} General function ( = endpoint.types.[get/post] )
 */
exports.build_endpoint_func = (general_func, base_func) => {
    return (req, res) => {
        return base_func(req, res, general_func);
    };
};
exports.endpoints = {};
exports.tasks = {};
exports.tasks.generation = {};
exports.createToken = (len, charset="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") => {
    return [...Array(len)].map(() => {return charset[Math.floor(Math.random()*charset.length)]}).join('');
}

exports.endpoints.generate = {
    path: "/generate",
    types: {"post": default_next},
    /**
     * @param req {Request}
     * @param res {Response}
     */
    func: async (req, res) => {

        /** PAYLOAD VERIFICATION **/
        const invalid_payload = () => {if (!res.headersSent) res.status(400).json({err: "Invalid request", details: "Payload is invalid"});};
        if (["players", "camera"].some((x) => {return !Object.keys(req.body).includes(x)})) {invalid_payload(); return}
        for (const player of req.body["players"]) {
            if (!Object.keys(player).includes("pos")) {invalid_payload(); return}
            if (["name", "uuid"].every((x) => {return !Object.keys(player).includes(x)})) {invalid_payload(); return}
        }

        /** TASK GENERATION **/
        let id = Date.now().toString(36);
        let this_task = {
            state: "pending",
            error: {code: 0, err: "", details: ""},
            camera: req.body["camera"],
            token: (req.body["protected"]||true)?exports.createToken(32):"0",
            players: req.body["players"].map(x => {return {name: x["name"], uuid: x["uuid"], pos: x["pos"]};})
        };
        exports.tasks.generation[id] = this_task;
        if (!res.headersSent && req.body["async"]) res.json({state: {id, token: this_task.token}});

        const raise_error = (code, err, details) => {
            this_task.state = "failed";
            this_task.error = {code, err, details};
            if (!res.headersSent) res.status(code).json({err, details});
        };

        /** UUID GRABBING **/
        await Promise.all(this_task.players.map(player => {
            return new Promise(async (resolve, _reject) => {
                if (player.name !== undefined && player.uuid === undefined) {
                    let uuid = (await axios.get(`https://api.mojang.com/users/profiles/minecraft/${player.name}`, {validateStatus: false})).data?.id
                    if (uuid === undefined) raise_error(404, "Player not found", `Unable to find player '${player.name}'`);
                    player.uuid = uuid;
                    resolve();
                }
            });
        }));
        console.log(this_task);
        // if (!res.headersSent) res.json({state: {id, token: this_task.token}});
    }
};
