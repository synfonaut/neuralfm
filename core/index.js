const log = require("debug")("neuralfm:core:index");

const db = require("./db").db;

const channels = require("./channels");
const networks = require("./networks");
const classifiers = require("./classifiers");
const plugins = require("../plugins");
const scrapers = require("./scrapers");
const extractors = require("./extractors");
const normalizers = require("./normalizers");

require("./compatibility");

async function setup() {
    log('setting up core db');
    await networks.createIndexes();
    await channels.createIndexes();
}

module.exports = {
    db,
    setup,
    channels,
    networks,
    classifiers,
    plugins,
    scrapers,
    extractors,
    normalizers,
};

