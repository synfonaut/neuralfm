const log = require("debug")("neuralfm:core:extract");
const database = require("../db").db;

async function extract(extractors, opts={}) {
    log("extracting");
    for (const extractor of extractors) {
        log(`extracting ${extractor.name}`);
        const dbname = extractor.getDatabaseName();
        const db = await database(dbname);
        const options = Object.assign({}, opts, { db });
        const instance = new extractor(db, options);
        const results = await instance.run();
        db.close();
        if (results && results.length > 0) {
            return results;
        }
    }
    return [];
}

module.exports = extract;

if (require.main === module) {
    (async function() {
        const utils = require("../../utils");
        const plugins = require("../../plugins");

        const extractors = Object.values(plugins.extractors);
        let results;
        do {
            results = await extract(extractors);
            log("sleeping");
            await utils.sleep(1000);
        } while (results.length > 0);

        process.exit();
    })();

}
