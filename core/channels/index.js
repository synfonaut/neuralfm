const log = require("debug")("neuralfm:core:channels");

const database = require("../db").db;
const config = require("../../config");


async function create(name, network=null) {
    if (network) {
        log(`creating channel ${name} with network ${network.name}`);
    } else {
        log(`creating channel ${name}`);
    }
}

if (require.main === module) {
    (async function() {

        await createIndexes();
        process.exit();
    })();

}
