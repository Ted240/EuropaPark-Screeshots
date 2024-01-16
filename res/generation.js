const jimp = require("jimp");

/**
 * @param _this {jimp} Image to proceed
 * @param x {Number} X coords
 * @param y {Number} Y coords
 * @return {[Number, Number, Number, Number]} R G B A values
 */
const getPixel = (_this, x, y) => {
    return Object.values(jimp.intToRGBA(_this.getPixelColor(x, y)));
};

/**
 * @param _this {jimp} Image to proceed
 * @param x {Number} X coords
 * @param y {Number} Y coords
 * @param r {Number} Red value
 * @param g {Number} Green value
 * @param b {Number} Blue value
 * @param a {Number} Alpha value
 */
const putPixel = (_this, x, y, r, g, b, a) => {
    _this.setPixelColor(jimp.rgbaToInt(r, g, b, a), x, y);
};

/**
 * @param cam_id {Number}
 * @param players {{Number: String}} {<pos>: <uuid>, ...}
 * @param output_name {String} Output file's name
 * @return {Promise<Boolean>} Operation finished
 */
module.exports.generate = (cam_id, players, output_name) => {
    return new Promise(async (resolve, _reject) => {
        let base = await jimp.read(`bases\\${cam_id}.png`);
        let render = await jimp.read(`bases\\${cam_id}.png`);
        let masks = [];
        for (const file of Object.keys(players).map(i => `${i}.png`)) {
            masks.push(await jimp.read(`masks/${cam_id}/${file}`));
        }
        let skins = [];
        for (const file of Object.values(players).map(i => `${i}.png`)) {
            skins.push(await jimp.read(`skins/${file}`));
        }

        for (let y = 0; y < base.getHeight(); y++) {
            for (let x = 0; x < base.getWidth(); x++) {
                let active_mask = Object.entries(masks)
                    .filter(([_, mask]) => {
                        return getPixel(mask, x, y)[3] !== 0
                    })
                    .map(([mask_i, mask]) => {
                        return [mask_i - (getPixel(mask, x, y)[3] - 128), mask, mask_i];
                    });
                if (active_mask.length > 1) active_mask.sort(_ => {
                    return _[0]
                })
                if (active_mask.length) {
                    let mask_i = active_mask[0][2];
                    let skin_coords = getPixel(masks[mask_i], x, y);
                    let skin_pxl = getPixel(skins[mask_i], skin_coords[0], skin_coords[1]);
                    const darken = (v) => {
                        return Math.round(v * (skin_coords[2] / 256));
                    };
                    putPixel(render, x, y, darken(skin_pxl[0]), darken(skin_pxl[1]), darken(skin_pxl[2]), 255);
                }
            }
        }
        render.write(`${__dirname}\\generated\\${output_name}.png`, () => {
            resolve(true);
        });
    })
}

module.exports = {...module.exports, putPixel, getPixel};

// let a = module.exports.generate(0, {1: "069a79f444e94726a5befca90e38aaf5"});
// a.then(console.log)
