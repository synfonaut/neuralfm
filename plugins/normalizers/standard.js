const log = require("debug")("neuralfm:plugins:normalizers:standard");

const mimir = require("mimir");
const bow = mimir.bow;
const dict = mimir.dict;

export class StandardFeatureNormalizer {
    constructor(db, scraper, extractor, opts={}) {
        if (!db) { throw "expected db" }
        this.db = db;

        if (!scraper) { throw "expected scraper" }
        this.scraper = scraper;

        if (!extractor) { throw "expected extractor" }
        this.extractor = extractor;
    }

    async run() {
        const data = await (await this.extractor.getDataCursor()).toArray();
        const normalizedFieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);
        const unnormalizedData = [];

        for (const row of data) {
            if (!row[normalizedFieldName]) {
                unnormalizedData.push(row);
            }
        }

        if (unnormalizedData.length > 0) {
            log(`detected ${unnormalizedData.length} ${this.scraper.constructor.name}:${this.extractor.constructor.name} features that need normalization`);
            console.log("NEED MINMAX", normalizedFieldName);
            let minmax = await this.db.collection(StandardFeatureNormalizer.getMinMaxCollectionName()).findOne({ name: normalizedFieldName });
            if (!minmax) {
                minmax = await this.createMinMaxNormalization(data);


            }
            console.log("MINMAX", minmax);
        }

        // find stuff that's not normalized
        // if needed normalize
        // where to store minmax? in own table?...

        //console.log(data);
        throw "BLAM";
        return [];
    }

    createMinMaxNormalization(data) {
        log(`generating minmax normalization for ${data.length} ${this.scraper.constructor.name}:${this.extractor.constructor.name} data`);

    }

    static getNormalizedFieldName(extractor) {
        return `${extractor.constructor.getFeaturesFieldName()}_normalized`;
    }

    static getMinMaxCollectionName() {
        return "standard_normalizer_minmax";
    }
}

export function minmax(rows, minimum=null, maximum=null) {
    let min = Infinity, max = -Infinity;
    for (const row of rows) {
        if (row < min) {
            min = row;
        }
        if (row > max) {
            max = row;
        }
    }

    if (minimum !== null) {
        if (min < minimum) { min = minimum }
        if (max < minimum) { max = minimum }
    }

    if (maximum !== null) {
        if (min > maximum) { min = maximum }
        if (max > maximum) { max = maximum }
    }

    return [min, max];
}

export function wordvector(rows) {
    rows.sort((a, b) => { return a.localeCompare(b) });
    return dict(rows);
}

export function bagofwords(text, vector) {
    return bow(text, vector);
}
