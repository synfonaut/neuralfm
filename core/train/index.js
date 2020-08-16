const log = require("debug")("neuralfm:core:train");
const database = require("../db").db;

export async function train(network) {
    log(`training ${network.name}`);
    await network.run();
}

