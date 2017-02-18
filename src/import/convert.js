const mongoose = require('mongoose');
const mongoXlsx = require('mongo-xlsx');
const Converter = require("csvtojson").Converter;
const async = require('async');
const fs = require('fs');
const moment = require('moment');
const createReadStream = fs.createReadStream;
const _ = require('lodash');
const PasswordManager = require('./../helpers/passwordManager');

mongoose.Schemas = mongoose.Schemas || {};
const config = require('./../config');
const mongo = require('./../utils/mongo');
const logger = require('./../utils/logger');
const types = require('./../types/index');
const LocationModel = require('./../types/domain/model');
const RetailSegmentModel = require('./../types/retailSegment/model');
const OutletModel = require('./../types/outlet/model');
const BranchModel = require('./../types/branch/model');
const PersonnelModel = require('./../types/personnel/model');
const AccessRoleModel = require('./../types/accessRole/model');
const PositionModel = require('./../types/position/model');
const CurrencyModel = require('./../types/currency/model');
const OriginModel = require('./../types/origin/model');
const BrandModel = require('./../types/brand/model');
const CategoryModel = require('./../types/category/model');
const VariantModel = require('./../types/variant/model');
const DisplayTypeModel = require('./../types/displayType/model');
const CompetitorVariantModel = require('./../types/competitorVariant/model');
const ItemModel = require('./../types/item/model');
const CompetitorItemModel = require('./../types/competitorItem/model');

const whereSheets = `${config.workingDirectory}/src/import/`;
const timestamp = 'Feb_18_2017';

const fetchCurrency = (callback) => {
    CurrencyModel.find({}).select('_id name').lean().exec(callback);
};

const fetchCategory = (callback) => {
    CategoryModel.find({}).select('_id name.en').lean().exec(callback);
};

const fetchOrigin = (callback) => {
    OriginModel.find({}).select('_id name.en').lean().exec(callback);
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

const fetchVariant = (callback) => {
    VariantModel.find({}).select('_id name.en').lean().exec(callback);
};

const fetchCompetitorVariant = (callback) => {
    CompetitorVariantModel.find({}).select('_id name.en').lean().exec(callback);
};

const fetchBrand = (callback) => {
    BrandModel.find({}).select('_id name.en').lean().exec(callback);
};

const getCurrencyIdByName = (options) => {
    const collection = options.collection;
    const name = options.name;

    if (!name) {
        return null;
    }

    const enNameParts = name
        .split(' ')
        .map((item) => {
            return item.toLowerCase();
        });

    for (let itemKey in collection) {
        const item = collection[itemKey];

        if (!item.name) {
            continue;
        }
        // if enName and _id are equals
        if (name.length === 3 && name === item._id) {
            return item._id;
        }

        // if enName and name.en are similar
        const itemNameParts = item.name
            .split(' ')
            .map((item) => {
                return item.toLowerCase();
            });

        let correctParts = 0;

        for (let it in enNameParts) {
            const enNamePart = enNameParts[it].toLowerCase();

            if (itemNameParts.includes(enNamePart)) {
                correctParts ++;
            }
        }

        if (enNameParts.length === correctParts) {
            return item._id;
        }
    }

    return null;
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
const getBrandIdByEnName = getSampleIdByEnNamePrototype;

const readCsv = (name, cb) => {
    const converter = new Converter({});
    const filePath = `${whereSheets}${timestamp}/${name}.csv`;

    converter.on('end_parsed', (array) => {
        cb(null, array)
    });

    createReadStream(filePath).pipe(converter);
};

const trimObjectValues = (obj) => {
    for (let key in obj) {
        const value = obj[key];

        if (_.isString(value)) {
            obj[key] = value.trim();
        }
    }

    return obj;
};

// sequence is important
async.series([

    importDisplayType,
    importCategory,
    importVariant,
    importCompetitorVariant,
    importBrand,
    importOrigin,
    importCurrency,
    importRole,
    importRetailSegment,
    importOutlet,
    importPosition,
    importDomain,
    importItem,
    importCompetitorItem,
    importBranch,
    importPersonnel

], (err) => {
    if (err) {
        console.log(err);
        process.exit(1);
        return;
    }

    console.log('Done!');
    process.exit(0);
});

const patchRecord = (options, callback) => {
    const query = options.query;
    const patch = options.patch;
    const DatabaseModel = options.model;

    async.waterfall([

        (cb) => {
            DatabaseModel.findOne(query, cb);
        },

        (existingModel, cb) => {
            if (existingModel === null) {
                const databaseModel = new DatabaseModel();

                databaseModel.set(patch);
                return databaseModel.save((err) => {
                    if (err) {
                        if (err.code === 11000) {
                            logger.error(err, query, patch);
                            return cb(null);
                        }

                        return cb(err);
                    }

                    cb(null, databaseModel);
                });
            }

            existingModel.set(patch);
            existingModel.save((err) => {
                if (err) {
                    if (err.code === 11000) {
                        logger.error(err, query, patch);
                        return cb(null);
                    }

                    return cb(err);
                }

                cb(null, existingModel);
            });
        }

    ], callback);
};

function importDisplayType(callback) {
    async.waterfall([

        async.apply(readCsv, 'Display'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    }
                });
                const query = {
                    'name.en': patch.name.en
                };

                patchRecord({
                    query,
                    patch,
                    model: DisplayTypeModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

function importCategory(callback) {
    async.waterfall([

        async.apply(readCsv, 'Category'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    }
                });
                const query = {
                    'name.en': patch.name.en
                };

                patchRecord({
                    query,
                    patch,
                    model: CategoryModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

function importVariant(callback) {
    async.waterfall([

        async.apply(readCsv, 'Variant'),

        (data, cb) => {
            async.waterfall([

                fetchCategory,

                (categoryCollection, cb) => {
                    async.mapLimit(data, 10, (sourceObj, mapCb) => {
                        const obj = trimObjectValues(sourceObj);
                        const patch = Object.assign({}, {
                            ID: obj.ID,
                            name: {
                                en: obj['Name (EN)'],
                                ar: obj['Name (AR)']
                            },
                            category: obj.Category
                        });

                        patch.category = getCategoryIdByEnName({
                            collection: categoryCollection,
                            name: patch.category
                        });

                        const query = {
                            'name.en': patch.name.en
                        };

                        patchRecord({
                            query,
                            patch,
                            model: VariantModel
                        }, mapCb);
                    }, cb)
                }

            ], cb);
        }

    ], callback);
}

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
                            ppt: obj.PPT,
                            rspMin: obj['RSP (Minimum)'],
                            rspMax: obj['RSP (Maximum)'],
                            pptPerCase: obj['PPT (Case)'],
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
                            'name.en': patch.name.en,
                            barCode: patch.barCode
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

                        const originId = getOriginIdByEnName({
                            collection: collections.origin,
                            name: patch.origin
                        });

                        patch.origin = [originId].filter((item) => (item));

                        patch.brand = getBrandIdByEnName({
                            collection: collections.brand,
                            name: patch.brand
                        });

                        patch.variant = getVariantIdByEnName({
                            collection: collections.competitorVariant,
                            name: patch.variant
                        });

                        patch.country = getLocationIdByEnName({
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

function importCompetitorVariant(callback) {
    async.waterfall([

        async.apply(readCsv, 'CompetitorVariant'),

        (data, cb) => {
            async.waterfall([

                fetchCategory,

                (categoryCollection, cb) => {
                    async.mapLimit(data, 50, (sourceObj, mapCb) => {
                        const obj = trimObjectValues(sourceObj);
                        const patch = Object.assign({}, {
                            ID: obj.ID,
                            name: {
                                en: obj['Name (EN)'],
                                ar: obj['Name (AR)']
                            },
                            category: obj.Category
                        });

                        patch.category = getCategoryIdByEnName({
                            collection: categoryCollection,
                            name: patch.category
                        });

                        const query = {
                            'name.en': patch.name.en,
                            country: patch.country
                        };

                        patchRecord({
                            query,
                            patch,
                            model: CompetitorVariantModel
                        }, mapCb);
                    }, cb)
                }

            ], cb);
        }

    ], callback);
}

function importBrand(callback) {
    async.waterfall([

        async.apply(readCsv, 'Brand'),

        (data, cb) => {
            /* todo */
            const ourBrand = {
                archived : false,
                ourCompany : true,
                imageSrc : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC',
                name : {
                    ar : 'Al alali',
                    en : 'Al alali'
                }
            };

            data.push(ourBrand);
            /* todo */

            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    },
                    ourCompany: !!obj['Our company']
                });
                const query = {
                    'name.en': patch.name.en
                };

                patchRecord({
                    query,
                    patch,
                    model: BrandModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

function importOrigin(callback) {
    async.waterfall([

        async.apply(readCsv, 'Origin'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    }
                });
                const query = {
                    'name.en': patch.name.en
                };

                patchRecord({
                    query,
                    patch,
                    model: OriginModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

function importCurrency(callback) {
    async.waterfall([

        async.apply(readCsv, 'Currency'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    _id: obj._id,
                    name: obj.name
                });
                const query = {
                    'name': patch.name
                };

                patchRecord({
                    query,
                    patch,
                    model: CurrencyModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

function importPosition(callback) {
    async.waterfall([

        async.apply(readCsv, 'Position'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    }
                });
                const query = {
                    'name.en': patch.name.en
                };

                patchRecord({
                    query,
                    patch,
                    model: PositionModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

function importRole(callback) {
    async.waterfall([

        async.apply(readCsv, 'Role'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    }
                });
                const query = {
                    'name.en': patch.name.en
                };

                patchRecord({
                    query,
                    patch,
                    model: AccessRoleModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

function importOutlet(callback) {
    async.waterfall([

        async.apply(readCsv, 'Outlet'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    }
                });
                const query = {
                    'name.en': patch.name.en
                };

                patchRecord({
                    query,
                    patch,
                    model: OutletModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

function importRetailSegment(callback) {
    async.waterfall([

        async.apply(readCsv, 'RetailSegment'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    }
                });
                const query = {
                    'name.en': patch.name.en
                };

                patchRecord({
                    query,
                    patch,
                    model: RetailSegmentModel
                }, mapCb);
            }, cb)
        }

    ], callback);
}

function importDomain(callback) {
    async.waterfall([

        async.apply(readCsv, 'Domain'),

        (data, cb) => {
            async.waterfall([

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
                                ar: obj['Name (AR)']
                            },
                            type: obj.Type,
                            parent: null,
                            xlsParent: parentProp,
                        });


                        patch.currency = getCurrencyIdByName({
                            collection: currencyCollection,
                            name: currencyProp
                        });

                        if (patch.type === 'sub-region') {
                            patch.type = 'subRegion';
                        }

                        const query = {
                            'name.en': patch.name.en,
                            type: patch.type
                        };

                        patchRecord({
                            query,
                            patch,
                            model: LocationModel
                        }, mapCb);
                    }, cb)
                },

                (collection, cb) => {
                    async.mapLimit(collection, 10, (model, mapCb) => {
                        // I want to find domain which has current ID as xlsParent
                        const xlsParent = model.get('ID');
                        const query = {
                            xlsParent: xlsParent ? xlsParent.toString() : null
                        };
                        // And update his relation to parent with current Mongo ID
                        const parent = model.get('_id');
                        const patch = {
                            parent: parent ? parent.toString() : null
                        };

                        LocationModel.update(query, patch, {
                            new: true,
                            multi:true
                        }, mapCb);
                    }, cb)
                }

            ], cb)
        }

    ], callback);
}

function importBranch(callback) {
    async.waterfall([

        async.apply(readCsv, 'Branch'),

        (data, cb) => {
            async.mapLimit(data, 300, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    },
                    address: {
                        en: obj['Address (EN)'],
                        ar: obj['Address (AR)']
                    }
                });
                const subRegion = obj['Sub-Region'];
                const retailSegment = obj['Retail Segment'];
                const outlet = obj['Outlet'];

                const parallelJobs = {};

                if (subRegion) {
                    parallelJobs.subRegion = (cb) => {
                        const query = {
                            'name.en': subRegion,
                            type: 'subRegion'
                        };

                        LocationModel.findOne(query).select('_id').lean().exec(cb);
                    }
                }

                if (retailSegment) {
                    parallelJobs.retailSegment = (cb) => {
                        const query = {
                            'name.en': retailSegment
                        };

                        RetailSegmentModel.findOne(query).select('_id').lean().exec(cb);
                    }
                }

                if (outlet) {
                    parallelJobs.outlet = (cb) => {
                        const query = {
                            'name.en': outlet
                        };

                        OutletModel.findOne(query).select('_id').lean().exec(cb);
                    }
                }

                async.parallel(parallelJobs, (err, population) => {
                    if (err) {
                        return mapCb(err);
                    }

                    patch.subRegion = population.subRegion ?
                        population.subRegion._id : null;
                    patch.retailSegment = population.retailSegment ?
                        population.retailSegment._id : null;
                    patch.outlet = population.outlet ?
                        population.outlet._id : null;

                    const query = {
                        'name.en': patch.name.en,
                        subRegion: patch.subRegion,
                        retailSegment: patch.retailSegment,
                        outlet: patch.outlet
                    };

                    patchRecord({
                        query,
                        patch,
                        model: BranchModel
                    }, mapCb);
                });
            }, cb);
        }

    ], callback);
}

const setStandardPasswordToYopmail = (patch) => {
    if (/yopmail/.test(patch.email)) {
        const demoPassword = '123456'; // fixme
        const timestamp = new Date();

        patch.pass = PasswordManager.encryptPasswordSync(demoPassword);
        patch.confirmed = timestamp;
        patch.lastAccess = timestamp; // just for UI view list personnel instead "Last Logged in null".
        patch.status = 'login';
    }

    return patch;
};

function importPersonnel(callback) {
    async.waterfall([

        async.apply(readCsv, 'Personnel'),

        (data, cb) => {
            async.mapLimit(data, 300, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    firstName: {
                        en: obj['First Name (EN)'],
                        ar: obj['First Name (AR)']
                    },
                    lastName: {
                        en: obj['Last Name (EN)'],
                        ar: obj['Last Name (AR)']
                    },
                    email: obj['Email'],
                    phoneNumber: obj['PhoneNumber'],
                    xlsManager: obj.Manager
                });

                const dateJoined = obj['Date of joining'];

                if (dateJoined) {
                    const momentDateJoined = moment(dateJoined, 'MM/DD/YY');

                    if (momentDateJoined.isValid()) {
                        patch.dateJoined = momentDateJoined.toDate();
                    }
                }

                if (patch.email) {
                    patch.email.toLowerCase();
                }

                const country = obj['Country'];
                const region = obj['Region'];
                const subRegion = obj['Sub-Region'];
                const branch = obj['Branch'];
                const position = obj['Position'];
                const accessRole = obj['Access role'];

                const parallelJobs = {};

                if (country) {
                    parallelJobs.country = (cb) => {
                        const countries = country
                            .split(',')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: countries
                            },
                            type: 'country'
                        };

                        LocationModel.find(query).select('_id').lean().exec(cb)
                    };
                }

                if (region) {
                    parallelJobs.region = (cb) => {
                        const regions = region
                            .split(',')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: regions
                            },
                            type: 'region'
                        };

                        LocationModel.find(query).select('_id').lean().exec(cb)
                    }
                }

                if (subRegion) {
                    parallelJobs.subRegion = (cb) => {
                        const subRegions = subRegion
                            .split(',')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: subRegions
                            },
                            type: 'subRegion'
                        };

                        LocationModel.find(query).select('_id').lean().exec(cb)
                    };
                }

                if (branch) {
                    parallelJobs.branch = (cb) => {
                        const branches = branch
                            .split('|')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: branches
                            }
                        };

                        BranchModel.find(query).select('_id').lean().exec(cb)
                    }
                }

                if (position) {
                    parallelJobs.position = (cb) => {
                        const query = {
                            'name.en': position.toUpperCase(),
                        };

                        PositionModel.findOne(query).select('_id').lean().exec(cb)
                    };
                }

                if (accessRole) {
                    parallelJobs.accessRole = (cb) => {
                        const query = {
                            'name.en': accessRole
                        };

                        AccessRoleModel.findOne(query).select('_id').lean().exec(cb)
                    };
                }

                async.parallel(parallelJobs, (err, population) => {
                    if (err) {
                        return mapCb(err);
                    }

                    patch.country = Array.isArray(population.country) ?
                        population.country.map((model) => {
                            return model._id;
                        }) : [];
                    patch.region = Array.isArray(population.region) ?
                        population.region.map((model) => {
                            return model._id;
                        }) : [];
                    patch.subRegion = Array.isArray(population.subRegion) ?
                        population.subRegion.map((model) => {
                            return model._id;
                        }) : [];
                    patch.branch = Array.isArray(population.branch) ?
                        population.branch.map((model) => {
                            return model._id;
                        }) : [];
                    patch.position = population.position ?
                        population.position._id : null;
                    patch.accessRole = population.accessRole ?
                        population.accessRole._id : null;

                    setStandardPasswordToYopmail(patch);

                    const query = {};

                    if (patch.email) {
                        query.email = patch.email;
                    } else {
                        query['firstName.en'] = patch.firstName.en;
                        query['lastName.en'] = patch.lastName.en;
                    }

                    patchRecord({
                        query,
                        patch,
                        model: PersonnelModel
                    }, mapCb);
                });
            }, cb);
        },

        (collection, cb) => {
            async.mapLimit(collection, 10, (model, mapCb) => {
                // I want to find domain which has current ID as xlsParent
                const query = {
                    xlsManager: model.get('ID')
                };
                // And update his relation to parent with current Mongo ID
                const patch = {
                    manager: model.get('_id')
                };

                PersonnelModel.update(query, patch, {
                    new: true,
                    multi: true
                }, mapCb);
            }, cb)
        }

    ], callback);
}

module.exports = {
    readCsv,
    trimObjectValues,
    fetchOrigin,
    fetchBrand,
    fetchCompetitorVariant,
    fetchDomainCountry,
    getSampleIdByEnNamePrototype,
    patchRecord
};
