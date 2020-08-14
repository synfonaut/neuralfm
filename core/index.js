const log = require("debug")("neuralfm:core:index");
const path = require("path");

const plugins = require("../plugins");
const db = require("./db").db;
const scrape = require("./scrape");

module.exports = {
    plugins,
    scrape,
    db,
};

