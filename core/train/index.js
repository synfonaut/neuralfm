const log = require("debug")("neuralfm:core:train");
const database = require("../db").db;

const plugins = require("../../plugins");


export async function train(network) {
    log(`training ${network.name}`);
    await network.run();
}

export async function load(fingerprint) {
    log(`loading network ${fingerprint}`);
    console.log("PLUGINS", plugins);
}
