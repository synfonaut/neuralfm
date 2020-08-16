const log = require("debug")("neuralfm:core:index");

const db = require("./db").db;

const networks = require("./networks");
const classifiers = require("./classifiers");
const plugins = require("../plugins");
const scrapers = require("./scrapers");
const extractors = require("./extractors");
const normalizers = require("./normalizers");

require("./compatibility");

module.exports = {
    db,
    networks,
    classifiers,
    plugins,
    scrapers,
    extractors,
    normalizers,
};

