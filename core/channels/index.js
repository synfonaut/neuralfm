const log = require("debug")("neuralfm:core:channels");

const database = require("../db").db;
const config = require("../../config");
const utils = require("../../utils");
const networks = require("../networks");


export async function create(name, network=null) {

    const channel = { name };

    if (network) {
        log(`creating channel ${name} with network ${network.name}`);
        channel.network = await network.toJSON();
    } else {
        log(`creating channel ${name}`);
        channel.network = null;
    }

    const db = await database(config.databaseName);
    const response = await db.collection(config.channelsCollectionName).insertOne(channel);
    if (!utils.ok(response)) {
        throw `error while creating channel ${name}`
    }

    if (response.result.n != 1) {
        throw `error while creating channel ${name}`
    }

    log(`sucessfully created channel ${name}`);

    return channel;
}

export async function getByName(name) {
    const db = await database(config.databaseName);
    const channel = await db.collection(config.channelsCollectionName).findOne({ name });

    if (channel.network && channel.network.fingerprint) {
        channel.network = await networks.loadFromData(channel.network);
    }

    db.close();
    return channel;
}

export async function createIndexes() {
    const db = await database(config.databaseName);
    await db.collection(config.channelsCollectionName).createIndex({"name": 1}, {"unique": true});
    db.close();
}

export async function resetDatabase() {
    const db = await database(config.databaseName);
    await db.collection(config.channelsCollectionName).deleteMany({});
    await createIndexes();
    db.close();
}

if (require.main === module) {
    (async function() {

        await createIndexes();
        process.exit();
    })();

}
