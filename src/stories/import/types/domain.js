const async = require('async');
const patchRecord = require('./../utils/patchRecord');
const trimObjectValues = require('./../utils/trimObjectValues');
const readCsv = require('./../utils/readCsv');
const fetchCurrency = require('./../utils/fetchCurrency');
const DomainModel = require('./../../../types/domain/model');
const DomainCollection = require('./../../../types/domain/collection');
const mapCurrency = require('./../utils/mapCurrency');

module.exports = (callback) => {
    async.waterfall([

        async.apply(readCsv, 'Domain'),

        (data, cb) => {
            async.waterfall([

                // normalize collection
                (cb) => {
                    DomainCollection.updateMany({
                        xlsParent: {
                            $ne: null,
                        },
                    }, {
                        $set: {
                            xlsParent: null,
                        },
                    }, (err) => {
                        if (err) {
                            return cb(err);
                        }

                        cb(null);
                    });
                },

                fetchCurrency,

                (currencyCollection, cb) => {
                    async.mapLimit(data, 10, (sourceObj, mapCb) => {
                        const obj = trimObjectValues(sourceObj);
                        const parentProp = obj.Parent === 'null' ? null : obj.Parent;
                        const currencyProp = obj.Currency;

                        const patch = Object.assign({}, {
                            ID: obj.ID,
                            name: {
                                en: obj['Name (EN)'],
                                ar: obj['Name (AR)'],
                            },
                            type: obj.Type,
                            parent: null,
                            xlsParent: parentProp,
                        });


                        patch.currency = mapCurrency({
                            collection: currencyCollection,
                            prop: currencyProp,
                        });

                        if (patch.type === 'sub-region') {
                            patch.type = 'subRegion';
                        }

                        const query = {
                            'name.en': patch.name.en,
                            type: patch.type,
                            archived: false,
                        };

                        patchRecord({
                            query,
                            patch,
                            model: DomainModel,
                        }, mapCb);
                    }, cb);
                },

                (collection, cb) => {
                    async.eachLimit(collection, 10, (model, eachCb) => {
                        // I want to find domain which has current ID as xlsParent
                        const xlsParent = model.get('ID');
                        const query = {
                            xlsParent: xlsParent ? xlsParent.toString() : null,
                        };
                        // And update his relation to parent with current Mongo ID
                        const parent = model.get('_id');
                        const patch = {
                            parent: parent ? parent.toString() : null,
                        };

                        DomainModel.update(query, patch, {
                            new: true,
                            multi: true,
                        }, eachCb);
                    }, cb);
                },

            ], cb);
        },

    ], callback);
};
