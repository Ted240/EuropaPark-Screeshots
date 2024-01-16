const {Request, Response} = require("express");
const axios = require("axios");
const fs = require("fs");
const jimp = require("jimp");
const generation = require("./generation");
const {JSONFile} = require("./jsonfile");

/**
 * @param req {Request}
 * @param res {Response}
 * @param next {CallableFunction}
 */
const default_next = (req, res, next) => {
    return next(req, res);
};
const post2get_next = (req, res, next) => {
    req.query = {...req.body};
    return next(req, res);
};

/**
 * Return combined endpoint functions
 *
 * @param general_func {CallableFunction} General function ( = endpoint.func )
 * @param base_func {CallableFunction} General function ( = endpoint.types.[get/post] )
 */
module.exports.build_endpoint_func = (general_func, base_func) => {
    return (req, res) => {
        return general_func(req, res, base_func)
    }
};
module.exports.endpoints = {};
module.exports.tasks = {};
module.exports.tasks.json = new JSONFile(`${__dirname}\\tasks.json`);
module.exports.tasks.generation = module.exports.tasks.json.content;
module.exports.createToken = (len, charset="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") => {
    return [...Array(len)].map(() => {return charset[Math.floor(Math.random()*charset.length)]}).join('');
}

module.exports.endpoints.generate = {
    path: "/generate",
    types: {post: default_next},
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
        let id = 0;
        do {
            id = Date.now().toString(36);
        } while (Object.keys(module.exports.tasks.generation).includes(id))
        let this_task = {
            state: "pending",
            error: {code: 0, err: "", details: ""},
            camera: req.body["camera"],
            protected: req.body["protected"] === undefined?true:req.body["protected"],
            token: module.exports.createToken(32),
            players: req.body["players"].map(x => {return {name: x["name"], uuid: x["uuid"], pos: x["pos"]};})
        };
        module.exports.tasks.generation[id] = this_task;
        if (!res.headersSent) res.json({state: {...this_task, id}});

        const raise_error = (code, err, details) => {
            this_task.state = "failed";
            this_task.error = {code, err, details};
        };

        /** UUID GRABBING **/
        if ((await Promise.all(this_task.players.map(player => {
            return new Promise(async (resolve, _reject) => {
                if (player.name !== undefined && player.uuid === undefined) {
                    let uuid = (await axios.get(`https://api.mojang.com/users/profiles/minecraft/${player.name}`, {validateStatus: false})).data?.id
                    if (uuid === undefined) {
                        raise_error(404, "Player not found", `Unable to find player '${player.name}'`);
                        resolve(false);
                    }
                    player.uuid = uuid;
                    resolve(true);
                }
            });
        }))).some(_ => !_)) return;

        /** SKIN GRABBING **/
        await Promise.all(this_task.players.map(player => {
            return new Promise(async (resolve, _reject) => {
                // Skin already saved in local folders
                if (player.uuid && !fs.readdirSync(`${__dirname}\\skins`).includes(`${player.uuid}.png`)) {
                    let skin_url_encoded = (await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${player.uuid}`, {validateStatus: false})).data?.properties[0].value;
                    let skin_url = JSON.parse(atob(skin_url_encoded))["textures"]["SKIN"]?.url;
                    let writer = fs.createWriteStream(`${__dirname}\\skins\\${player.uuid}.png`);
                    (await axios.get(skin_url, {validateStatus: false, responseType: "stream"})).data.pipe(writer);
                    await new Promise((resolve_writer, reject_writer) => {
                        writer.on('finish', resolve_writer);
                        writer.on('error', reject_writer);
                    });

                    /** Verify if skin is 64x32 (legacy format : Notch/jeb_), if so convert to 64x64 (regular format) **/
                    const skin_img = await jimp.read(`skins\\${player.uuid}.png`);
                    if (skin_img["bitmap"].height === 32) {
                        await (new Promise(async (resolve_render, _reject) => {
                            const corr_skin = new jimp(64, 64, 0);
                            const skin_conv_template = await jimp.read(`skins\\_legacy_template.png`);
                            for (let y = 0; y < 64; y++) {
                                for (let x = 0; x < 64; x++) {
                                    let [pxl_x, pxl_y, _, alpha] = generation.getPixel(skin_conv_template, x, y);
                                    if (alpha) generation.putPixel(corr_skin, x, y, ...generation.getPixel(skin_img, pxl_x, pxl_y));
                                }
                            }
                            corr_skin.write(`skins\\${player.uuid}.png`, () => {
                                resolve_render();
                            });
                        }))
                    }
                }
                resolve();
            });
        }));

        /** Render generation **/
        let _players = {};
        let _skins_files = fs.readdirSync(`${__dirname}\\skins`);
        this_task.players.forEach(p => {if (p.uuid !== undefined && p.pos !== undefined && _skins_files.includes(`${p.uuid}.png`)) _players[p.pos] = p.uuid});
        if (await generation.generate(this_task.camera, _players, id)) {
            this_task.state = 'finished';
            module.exports.tasks.json.content[id] = this_task;
            module.exports.tasks.json.save();
        }
    }
};

module.exports.endpoints.view = {
    path: "/view",
    types: {get: default_next, post: post2get_next},
    /**
     * @param req {Request}
     * @param res {Response}
     */
    func: async (req, res) => {

        // Missing field 'id'
        if (req.query.id === undefined) {
            if (!res.headersSent) res.status(400).json({err: "Incomplet payload", details: "Missing field 'id'"});
            return;
        }

        // Task with id specified not found
        if (!Object.keys(module.exports.tasks.generation).includes(req.query.id)) {
            if (!res.headersSent) res.status(404).json({err: "Ressource not found", details: `Task with id ${req.query.id} was not found`});
            return;
        }

        // If task is protected, deny bad tokens
        const this_task = module.exports.tasks.generation[req.query.id];
        if (this_task.protected && this_task.token !== req.query.token) {
            if (module.exports.config.server?.["fake_404"] === false) {
                // Unauthorized if fake_404 parameter is disabled
                if (!res.headersSent) res.status(403).json({err: "Restricted access", details: `Token given is invalid`});
                return;
            }
            // Fake 404 on unauthorized access
            if (!res.headersSent) res.status(404).json({err: "Ressource not found", details: `Task with id ${req.query.id} was not found`});
            return;
        }

        // Task with id specified is still pending
        let renders = fs.readdirSync(`${__dirname}\\generated`);
        if (!renders.includes(`${req.query.id}.png`) || this_task.state !== 'finished') {
            if (!res.headersSent) res.status(202).json({err: "Ressource busy", details: `Task with id ${req.query.id} is still pending, wait process ending`, state: this_task});
            return;
        }
        res.status(200).sendFile(`${__dirname}\\generated\\${req.query.id}.png`);
    }
};

module.exports.config = {};