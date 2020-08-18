const log = require("debug")("neuralfm:core:classifiers");
const database = require("../db").db;
const config = require("../../config");
const utils = require("../../utils");

export class Classifier {
    constructor(name) {
        if (!name) { throw "expected name" }
        this.name = name;
    }

    async classify(fingerprint, classification) {
        if (classification < -1 || classification > 1) {
            throw "expected classification to be between -1 and 1";
        }

        const db = await database(Classifier.getDatabaseName());
        log(`classifying ${this.name} ${fingerprint} to ${classification}`);

        const created_date = new Date();
        try {
            const response = await db.collection(Classifier.getCollectionName()).insertOne({
                name: this.name,
                fingerprint,
                classification,
                created_date,
            });

            if (utils.ok(response)) {
                if (response.result.n >= 1) {
                    log(`classified ${this.name} ${fingerprint} to ${classification}`);
                } else {
                    log(`skipped classifying ${this.name} ${fingerprint}... already classified`);
                }
            }
        } catch (e) {
            log(`skipped classifying ${this.name} ${fingerprint}... already classified`);
        } finally {
            db.close();
        }
    }

    async unclassify(fingerprint) {
        log(`unclassifying ${this.name} ${fingerprint}`);
        const db = await database(Classifier.getDatabaseName());
        const response = await db.collection(Classifier.getCollectionName()).deleteOne({
            name: this.name,
            fingerprint,
        });

        if (utils.ok(response)) {
            if (response.result.n >= 1) {
                log(`unclassified ${this.name} ${fingerprint}`);
            } else {
                log(`skipped unclassifying ${this.name} ${fingerprint}... couldn't find record`);
            }
        }

        db.close();
    }

    async getClassifications() {
        log(`getting classifications for ${this.name}`);
        const db = await database(Classifier.getDatabaseName());
        const classifications = await (db.collection(Classifier.getCollectionName()).find({ name: this.name }).toArray());
        db.close();
        return classifications;
    }

    async getClassificationMapping(classifications=null) {
        if (!classifications) {
            classifications = await this.getClassifications();
        }
        const classificationMapping = {};
        for (const classification of classifications) {
            const classificationValue = Number(classification.classification);
            if (classificationValue < -1 || classificationValue > 1) { throw "expected classification value to be between -1 and 1" }
            classificationMapping[classification.fingerprint] = classificationValue;
        }
        return classificationMapping;
    }

    static getCollectionName() {
        return "classifications";
    }

    static getDatabaseName() {
        return config.databaseName;
    }

    static async getAllClassifications() {
        const db = await database(Classifier.getDatabaseName());
        const classifications = await (db.collection(Classifier.getCollectionName()).find({}).toArray());
        db.close();
        return classifications;
    }

    static async createIndexes() {
        const db = await database(this.getDatabaseName());
        await db.collection(this.getCollectionName()).createIndex({ "name": 1, "fingerprint": 1 }, {"unique": true});
        db.close();
    }

    static async resetDatabase() {
        const db = await database(this.getDatabaseName());
        await db.collection(this.getCollectionName()).deleteMany({});
        await Classifier.createIndexes();
        db.close();
    }
}

