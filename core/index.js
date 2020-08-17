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
    await classifiers.Classifier.createIndexes();

    for (const scraper of Object.values(plugins.scrapers)) {
        await scraper.createIndexes();

        const databaseName = scraper.getDatabaseName();
        const database = await db(databaseName);
        for (const normalizer of Object.values(plugins.normalizers)) {
            const compatibleExtractors = extractors.getCompatible(normalizer);
            for (const compatibleExtractor of compatibleExtractors) {
                await normalizer.createNormalizationFieldIndexes(database, compatibleExtractor);
            }
        }
        database.close();
    }
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

