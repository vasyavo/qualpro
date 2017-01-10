const async = require('async');
const patchRecord = require('./../utils/patchRecord');
const trimObjectValues = require('./../utils/trimObjectValues');
const readCsv = require('./../utils/readCsv');
const OriginModel = require('./../../../types/origin/model');
const CategoryModel = require('./../../../types/category/model');
const VariantModel = require('./../../../types/variant/model');
const LocationModel = require('./../../../types/domain/model');
const ItemModel = require('./../../../types/item/model');

const fetchOrigin = (callback) => {
    OriginModel.find({}).select('_id name.en').lean().exec(callback);
};

const fetchCategory = (callback) => {
    CategoryModel.find({}).select('_id name.en').lean().exec(callback);
};

const fetchVariant = (callback) => {
    VariantModel.find({}).select('_id name.en').lean().exec(callback);
};

const fetchDomainCountry = (callback) => {
    LocationModel
        .find({
            type: 'country'
        })
        .select('_id name.en')
        .lean()
        .exec(callback);
};

const getSampleIdByEnNamePrototype = (options) => {
    const collection = options.collection;
    const name = options.name;

    return collection
            .filter((item) => {
                return item.name.en === name;
            })
            .map((item) => (item._id))
            .pop() || null;
};

const getCategoryIdByEnName = getSampleIdByEnNamePrototype;
const getOriginIdByEnName = getSampleIdByEnNamePrototype;
const getVariantIdByEnName = getSampleIdByEnNamePrototype;
const getLocationIdByEnName = getSampleIdByEnNamePrototype;

function importItem(callback) {
    async.waterfall([

        async.apply(readCsv, 'Item'),

        (data, cb) => {
            async.waterfall([

                (cb) => {
                    async.parallel({

                        origin: fetchOrigin,
                        category: fetchCategory,
                        variant: fetchVariant,
                        country: fetchDomainCountry,

                    }, cb);
                },

                (collections, cb) => {
                    async.mapLimit(data, 10, (sourceObj, mapCb) => {
                        const obj = trimObjectValues(sourceObj);
                        const patch = Object.assign({}, {
                            ID: obj.ID,
                            name: {
                                en: obj['Name (EN)'],
                                ar: obj['Name (AR)']
                            },
                            barCode: obj.Barcode,
                            packing: obj.Packing,
                            ppt: obj.PTT,
                            rspMin: obj['RSP (Minimum)'],
                            rspMax: obj['RSP (Maximum)'],
                            pptPerCase: obj['PTT (Case)'],
                            origin: obj.Origin,
                            category: obj.Category,
                            variant: obj.Variant,
                            country: obj.Country
                        });

                        patch.origin = [getOriginIdByEnName({
                            collection: collections.origin,
                            name: patch.origin
                        })].filter((item) => (item));

                        patch.category = getCategoryIdByEnName({
                            collection: collections.category,
                            name: patch.category
                        });

                        patch.variant = getVariantIdByEnName({
                            collection: collections.variant,
                            name: patch.variant
                        });

                        patch.country = getLocationIdByEnName({
                            collection: collections.country,
                            name: patch.country
                        });

                        const query = {
                            ID: patch.ID,
                        };

                        patchRecord({
                            query,
                            patch,
                            model: ItemModel
                        }, mapCb);
                    }, cb)
                }

            ], cb);
        }

    ], callback);
}

module.exports = importItem;
