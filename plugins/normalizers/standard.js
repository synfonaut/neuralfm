const log = require("debug")("neuralfm:plugins:normalizers:standard");

const utils = require("../../utils");

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
        const recentlyNormalizedData = [];

        for (const row of data) {
            if (!row[normalizedFieldName]) {
                unnormalizedData.push(row);
            }
        }

        if (unnormalizedData.length > 0) {
            log(`detected ${unnormalizedData.length} ${this.scraper.constructor.name}:${this.extractor.constructor.name} features that need normalization`);
            let normalizationMetadata = await this.db.collection(StandardFeatureNormalizer.getCollectionName()).findOne({ _name: normalizedFieldName });
            if (normalizationMetadata) {
                log(`found existing normalization metdata`);
            } else {
                log(`missing normalization metdata... generating`);
                normalizationMetadata = await this.createNormalizationMetadata(data);
            }

            for (const unnormalized of unnormalizedData) {
                recentlyNormalizedData.push(await this.updateNormalizationValues(unnormalized[this.extractor.constructor.getFeaturesFieldName()], normalizationMetadata));
            }
        } else {
            log(`no features need normalizing from ${this.scraper.constructor.name}:${this.extractor.constructor.name}`);
        }

        return recentlyNormalizedData;
    }

    async updateNormalizationValues(unnormalized, metadata) {
        log(`normalizing ${unnormalized.fingerprint}`);

        const normalized = {
            fingerprint: unnormalized.fingerprint,
        };
        delete unnormalized["fingerprint"];

        for (const key in metadata) {
            if (key.indexOf("_") === 0) { continue }
            const keymeta = metadata[key];
            if (keymeta.type == "numeric" || keymeta.type == "date") {
                normalized[key] = normalizeValue(unnormalized[key], keymeta.minmax[0], keymeta.minmax[1]);
            } else if (keymeta.type == "string") {
                normalized[key] = bagofwords(unnormalized[key], keymeta.vector);
            } else {
                throw new Error(`unknown metadata key '${key}' type=${keymeta.type}`);
            }
        }

        const fieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);
        const setQuery = {"$set": {}};
        setQuery["$set"][fieldName] = normalized;

        const response = await this.db.collection(this.scraper.constructor.getCollectionName()).update({"fingerprint": normalized.fingerprint}, setQuery);
        if (!utils.ok(response)) {
            log(`error updating normalization values for ${normalized.fingerprint} - ${response}`);
        }

        return normalized;
    }

    async createNormalizationMetadata(rows) {
        log(`generating normalization metadata for ${rows.length} ${this.scraper.constructor.name}:${this.extractor.constructor.name} data`);

        let keymapping = new Map();

        const normalizedFieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);
        const featureKeyName = this.extractor.constructor.getFeaturesFieldName();
        for (const row of rows) {
            const features = row[featureKeyName];
            for (const key in features) {
                if (key === "fingerprint") { continue }

                const val = features[key];
                if (typeof val === "number") {
                    keymapping.set(key, "numeric");
                } else if (typeof val == "object" && val instanceof Date) {
                    keymapping.set(key, "date");
                } else if (typeof val == "string") {
                    keymapping.set(key, "string");
                } else {
                    throw new Error(`unknown metadata key ${key}`);
                }
            }
        }

        const keys = new Map([...keymapping.entries()].sort());

        const metadata = {};

        for (const [key, keytype] of keys) {
            const values = rows.map(row => { return row[featureKeyName][key] });
            if (keytype == "numeric") {
                const numericValues = values.map(Number);
                const valueMinMax = minmax(numericValues);
                metadata[key] = { type: keytype, minmax: valueMinMax };
            } else if (keytype == "date") {
                const valueMinMax = minmax(values);
                metadata[key] = { type: keytype, minmax: valueMinMax };
            } else if (keytype == "string") {
                const vector = wordvector(values);
                metadata[key] = { type: keytype, vector };
            } else {
                throw new Error(`unknown metadata key '${key}' type=${keytype}`);
            }
        }

        metadata["_name"] = normalizedFieldName;

        await this.db.collection(StandardFeatureNormalizer.getCollectionName()).insertOne(metadata);

        return metadata;
    }

    static getNormalizedFieldName(extractor) {
        return `${extractor.constructor.getFeaturesFieldName()}_normalized`;
    }

    static getCollectionName() {
        return "standard_normalizer_metadata";
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

export function normalizeValue(val, min, max) {
    if (val < min) { val = min }
    if (val > max) { val = max }

    const value = (val - min) / (max - min);

    return (isNaN(value) ? min : value);
}

export function normalizeValues(arr, min, max) {
    return arr.map((value) => { return normalizeValue(value, min, max) });
}

export function wordvector(rows) {
    rows.sort((a, b) => { return a.localeCompare(b) });
    return dict(rows);
}

export function bagofwords(text, vector) {
    const results = bow(text, vector);
    const mm = minmax(results);
    const normal = normalizeValues(results, mm[0], mm[1]);
    return normal;
}
