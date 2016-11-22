const mongoose = require('mongoose');
const mongoXlsx = require('mongo-xlsx');
const async = require('async');
const fs = require('fs');
const moment = require('moment');

mongoose.Schemas = mongoose.Schemas || {};
const config = require('./../config');
const mongo = require('./../utils/mongo');
const types = require('./../types/index');
const LocationModel = require('./../types/domain/model');
const RetailSegmentModel = require('./../types/retailSegment/model');
const OutletModel = require('./../types/outlet/model');
const BranchModel = require('./../types/branch/model');
const PersonnelModel = require('./../types/personnel/model');
const AccessRoleModel = require('./../types/accessRole/model');
const PositionModel = require('./../types/position/model');
const CurrencyModel = require('./../types/currency/model');

const whereSheets = `${config.workingDirectory}/src/import/`;
const timestamp = 'Nov_21_2016';

const mergeOptions = {
    upsert: true,
    new: true
};

function fetchCurrency(callback) {
    CurrencyModel.find({}).select('_id name').lean().exec(callback);
}

function getCurrencyIdByName(options) {
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
}

async.series([

    importRole,
    importRetailSegment,
    importOutlet,
    importPosition,
    importDomain,
    importBranch,
    importPersonnel

], (err) => {
    if (err) {
        return console.log(err);
    }

    return console.log('Done!');
});


function importPosition(callback) {
    async.waterfall([

        (cb) => {
            mongoXlsx.xlsx2MongoData(`${whereSheets}${timestamp}/Position.xlsx`, null, cb);
        },

        (mongoData, name, cb) => {
            async.mapLimit(mongoData, 10, (obj, eachCb) => {
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

                PositionModel.findOneAndUpdate(query, patch, mergeOptions, eachCb)
            }, cb)
        }

    ], callback);
}

function importRole(callback) {
    async.waterfall([

        (cb) => {
            mongoXlsx.xlsx2MongoData(`${whereSheets}${timestamp}/Role.xlsx`, null, cb);
        },

        (mongoData, name, cb) => {
            async.mapLimit(mongoData, 10, (obj, mapCb) => {
                const patch = Object.assign({}, {
                    name: {
                        en: obj['Name (EN)'],
                        ar: obj['Name (AR)']
                    }
                });
                const query = {
                    'name.en': patch.name.en
                };

                AccessRoleModel.findOneAndUpdate(query, patch, mergeOptions, mapCb)
            }, cb)
        }

    ], callback);
}

function importOutlet(callback) {
    async.waterfall([

        (cb) => {
            mongoXlsx.xlsx2MongoData(`${whereSheets}${timestamp}/Outlet.xlsx`, null, cb);
        },

        (mongoData, name, cb) => {
            async.mapLimit(mongoData, 10, (obj, mapCb) => {
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

                OutletModel.findOneAndUpdate(query, patch, mergeOptions, mapCb)
            }, cb)
        }

    ], callback);
}

function importRetailSegment(callback) {
    async.waterfall([

        (cb) => {
            mongoXlsx.xlsx2MongoData(`${whereSheets}${timestamp}/RetailSegment.xlsx`, null, cb);
        },

        (mongoData, name, cb) => {
            async.mapLimit(mongoData, 10, (obj, mapCb) => {
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

                RetailSegmentModel.findOneAndUpdate(query, patch, mergeOptions, mapCb)
            }, cb)
        }

    ], callback);
}

function importDomain(callback) {
    async.waterfall([

        (cb) => {
            mongoXlsx.xlsx2MongoData(`${whereSheets}${timestamp}/Domain.xlsx`, null, cb);
        },

        (mongoData, name, cb) => {
            async.waterfall([

                fetchCurrency,

                (currencyCollection, cb) => {
                    async.mapLimit(mongoData, 10, (obj, mapCb) => {
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

                        LocationModel.findOneAndUpdate(query, patch, mergeOptions, mapCb)
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

                        LocationModel.findOneAndUpdate(query, patch, {
                            new: true
                        }, mapCb);
                    }, cb)
                }

            ], cb)
        }

    ], callback);
}

function importBranch(callback) {
    async.waterfall([

        (cb) => {
            mongoXlsx.xlsx2MongoData(`${whereSheets}${timestamp}/Branch.xlsx`, null, cb);
        },

        (mongoData, name, cb) => {
            async.mapLimit(mongoData, 300, (obj, mapCb) => {
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

                async.parallel({

                    location: (cb) => {
                        const query = {
                            'name.en': subRegion
                        };

                        LocationModel.findOne(query).select('_id').lean().exec(cb)
                    },

                    retailSegment: (cb) => {
                        const query = {
                            'name.en': retailSegment
                        };

                        RetailSegmentModel.findOne(query).select('_id').lean().exec(cb)
                    },

                    outlet: (cb) => {
                        const query = {
                            'name.en': outlet
                        };

                        OutletModel.findOne(query).select('_id').lean().exec(cb)
                    }

                }, (err, population) => {
                    if (err) {
                        return mapCb(err);
                    }

                    patch.subRegion = population.location ?
                        population.location._id : null;
                    patch.retailSegment = population.retailSegment ?
                        population.retailSegment._id : null;
                    patch.outlet = population.outlet ?
                        population.outlet._id : null;

                    const query = {
                        'name.en': patch.en
                    };

                    BranchModel.findOneAndUpdate(query, patch, mergeOptions, mapCb)
                });
            }, cb);
        }

    ], callback);
}

function importPersonnel(callback) {
    async.waterfall([

        (cb) => {
            mongoXlsx.xlsx2MongoData(`${whereSheets}${timestamp}/Personnel.xlsx`, null, cb);
        },

        (mongoData, name, cb) => {
            async.mapLimit(mongoData, 300, (obj, mapCb) => {
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
                    phoneNumber: obj['PhoneNumber']
                });

                const dateJoined = obj['Date of joining'];

                if (dateJoined) {
                //    patch.dateJoined = moment(dateJoined, 'MMDDYY')
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
                            }
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
                            }
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
                            }
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
                            'name.en': position
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

                    const query = {};

                    if (patch.email) {
                        query.email = patch.email;
                    } else {
                        query['firstName.en'] = patch.firstName.en;
                        query['lastName.en'] = patch.lastName.en;
                    }

                    PersonnelModel.findOneAndUpdate(query, patch, mergeOptions, mapCb)
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

                PersonnelModel.findOneAndUpdate(query, patch, {
                    new: true
                }, mapCb);
            }, cb)
        }

    ], callback);
}
