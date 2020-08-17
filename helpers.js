const log = require("debug")("neuralfm:helpers");
const fs = require("fs");
const assert = require("assert");

const core = require("./core");
const scrapersCore = require("./core/scrapers");

export async function setupTestDatabase() {
    log(`setting up test database`);

    const networks = Object.values(core.plugins.networks);
    for (const network of networks) {
        await network.resetDatabase();
    }

    const scrapers = scrapersCore.getCompatible(core.plugins.extractors.TwitterFeatureExtractor);
    assert(scrapers && scrapers.length > 0);
    const fixtures = JSON.parse(fs.readFileSync("./plugins/extractors/fixtures.json", "utf8"));
    for (const scraper of scrapers) {
        const databaseName = await scraper.getDatabaseName();
        assert.equal(databaseName.indexOf("Test"), 0);
        const db = await core.db(databaseName);

        await scraper.resetDatabase();
        await core.plugins.normalizers.StandardFeatureNormalizer.resetDatabase(databaseName);
        await core.classifiers.Classifier.resetDatabase();

        await db.collection(scraper.getCollectionName()).insertMany(fixtures);
        const results = await db.collection(scraper.getCollectionName()).find({}).toArray();
        assert.equal(results.length, 10);

        await core.plugins.networks.BrainNeuralNetwork.resetDatabase();

        await core.networks.createIndexes();

        db.close();
    }
}
