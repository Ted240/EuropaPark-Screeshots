const jimp = require("jimp");

const getPixel = (_this, x, y) => {return Object.values(jimp.intToRGBA(_this.getPixelColor(x, y)));}
const putPixel = (_this, x, y, r, g, b, a) => {_this.setPixelColor(jimp.rgbaToInt(r, g, b, a), x, y);}

exports.generate = (cam_id, players) => {
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
        render.write("render.png", () => {
            console.log("Saved");
            resolve("render.png");
        });
    })
}
let a = exports.generate(0, {1: "skin_0"});
a.then(console.log)
