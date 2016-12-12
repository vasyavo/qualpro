const async = require('async');
const convert = require('./convert');
const logger = require('./../utils/logger');

const readCsv = convert.readCsv;
const trimObjectValues = convert.trimObjectValues;
const fetchOrigin = convert.fetchOrigin;
const fetchBrand = convert.fetchBrand;
const fetchCompetitorVariant = convert.fetchCompetitorVariant;
const fetchDomainCountry = convert.fetchDomainCountry;
const getSampleIdByEnNamePrototype = convert.getSampleIdByEnNamePrototype;
const patchRecord = convert.patchRecord;

const CompetitorItemModel = require('./../types/competitorItem/model');

function importCompetitorItem(callback) {
    async.waterfall([

        async.apply(readCsv, 'CompetitorItem'),

        (data, cb) => {
            async.waterfall([

                (cb) => {
                    async.parallel({

                        origin: fetchOrigin,
                        brand: fetchBrand,
                        competitorVariant: fetchCompetitorVariant,
                        country: fetchDomainCountry,

                    }, cb);
                },

                (collections, cb) => {
                    async.mapLimit(data, 50, (sourceObj, mapCb) => {
                        const obj = trimObjectValues(sourceObj);
                        const patch = Object.assign({}, {
                            ID: obj.ID,
                            name: {
                                en: obj['Name (EN)'],
                                ar: obj['Name (AR)']
                            },
                            packing: obj.Size,
                            brand: obj.Brand,
                            variant: obj.Variant,
                            country: obj.Country,
                            origin: [obj.Origin]
                        });

                        const originId = getSampleIdByEnNamePrototype({
                            collection: collections.origin,
                            name: patch.origin
                        });

                        patch.origin = [originId].filter((item) => (item));

                        patch.brand = getSampleIdByEnNamePrototype({
                            collection: collections.brand
                                .filter((item) => (item.name)),
                            name: patch.brand
                        });

                        patch.variant = getSampleIdByEnNamePrototype({
                            collection: collections.competitorVariant,
                            name: patch.variant
                        });

                        patch.country = getSampleIdByEnNamePrototype({
                            collection: collections.country,
                            name: patch.country
                        });

                        const query = {
                            'name.en': patch.name.en,
                            packing: patch.packing,
                            origin: patch.origin,
                            brand: patch.brand,
                            variant: patch.variant,
                            country: patch.country
                        };

                        patchRecord({
                            query,
                            patch,
                            model: CompetitorItemModel
                        }, mapCb);
                    }, cb)
                }

            ], cb);
        }

    ], callback);
}

importCompetitorItem((err) => {
    if (err) {
        logger.error('Something went wrong...', err);
        process.exit(1);
        return;
    }

    logger.info('Done!');
    process.exit(0);
});
