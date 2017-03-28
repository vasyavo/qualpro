const async = require('async');
const moment = require('moment');
const _ = require('lodash');
const trimObjectValues = require('./../utils/trimObjectValues');
const readCsv = require('./../utils/readCsv');
const PasswordManager = require('./../../../helpers/passwordManager');
const DomainModel = require('./../../../types/domain/model');
const BranchModel = require('./../../../types/branch/model');
const PositionModel = require('./../../../types/position/model');
const AccessRoleModel = require('./../../../types/accessRole/model');
const PersonnelModel = require('./../../../types/personnel/model');
const PersonnelCollection = require('./../../../types/personnel/collection');

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

const pathPersonnel = (options, callback) => {
    const {
        patch,
    } = options;

    async.parallel([

        (cb) => {
            if (patch.email) {
                const query = {
                    $or: [{
                        'firstName.en': patch.firstName.en,
                        'lastName.en': patch.lastName.en,
                        email: patch.email,
                    }, {
                        // vise verse first name and last name
                        'firstName.en': patch.lastName.en,
                        'lastName.en': patch.firstName.en,
                        email: patch.email,
                    }],
                };

                return PersonnelModel.findOne(query).exec(cb);
            }

            cb(null);
        },

        (cb) => {
            if (patch.phoneNumber) {
                const query = {
                    $or: [{
                        'firstName.en': patch.firstName.en,
                        'lastName.en': patch.lastName.en,
                        phoneNumber: patch.phoneNumber,
                    }, {
                        // vise verse first name and last name
                        'firstName.en': patch.lastName.en,
                        'lastName.en': patch.firstName.en,
                        phoneNumber: patch.phoneNumber,
                    }],
                };

                return PersonnelModel.findOne(query).exec(cb);
            }

            cb(null);
        },

        (cb) => {
            if (!patch.email && !patch.phoneNumber) {
                const query = {
                    $or: [{
                        'firstName.en': patch.firstName.en,
                        'lastName.en': patch.lastName.en,
                    }, {
                        // vise verse first name and last name
                        'firstName.en': patch.lastName.en,
                        'lastName.en': patch.firstName.en,
                    }],
                };

                return PersonnelModel.findOne(query).exec(cb);
            }

            cb(null);
        },

    ], (err, setResult) => {
        if (err) {
            return callback(null);
        }

        const setPersonnel = setResult.filter(personnel => personnel);

        if (setPersonnel.length) {
            const existingPersonnel = setPersonnel.pop();

            patch.$addToSet = {};

            if (patch.country) {
                patch.$addToSet.country = {
                    $each: patch.country,
                };

                delete patch.country;
            }

            if (patch.region) {
                patch.$addToSet.region = {
                    $each: patch.region,
                };

                delete patch.region;
            }

            if (patch.subRegion) {
                patch.$addToSet.subRegion = {
                    $each: patch.subRegion,
                };

                delete patch.subRegion;
            }

            if (patch.branch) {
                patch.$addToSet.branch = {
                    $each: patch.branch,
                };

                delete patch.branch;
            }

            existingPersonnel.set(patch);

            return existingPersonnel.save((err) => {
                if (err) {
                    if (err.code === 11000) {
                        return callback(null);
                    }

                    return callback(null);
                }

                callback(null, existingPersonnel);
            });
        }

        const newPersonnel = new PersonnelModel();

        newPersonnel.set(patch);

        return newPersonnel.save((err) => {
            if (err) {
                if (err.code === 11000) {
                    return callback(null);
                }

                return callback(null);
            }

            callback(null, newPersonnel);
        });
    });
};

const cleanXlsParent = (callback) => {
    PersonnelCollection.updateMany({
        xlsParent: {
            $ne: null,
        },
    }, {
        $set: {
            xlsParent: null,
        },
    }, (err) => {
        if (err) {
            return callback(err);
        }

        callback(null);
    });
};

module.exports = (callback) => {
    async.waterfall([

        // normalize collection
        (cb) => {
            async.series([

                cleanXlsParent,

            ], (err) => {
                if (err) {
                    return cb(err);
                }

                cb(null);
            });
        },

        async.apply(readCsv, 'Personnel'),

        (data, cb) => {
            async.mapLimit(data, 10, (sourceObj, mapCb) => {
                const obj = trimObjectValues(sourceObj);
                const patch = Object.assign({}, {
                    ID: obj.ID,
                    firstName: {
                        en: obj['First Name (EN)'].toUpperCase(),
                        ar: obj['First Name (AR)'],
                    },
                    lastName: {
                        en: obj['Last Name (EN)'].toUpperCase(),
                        ar: obj['Last Name (AR)'],
                    },
                    email: obj.Email.toLowerCase(),
                    phoneNumber: obj.PhoneNumber,
                    xlsManager: obj.Manager,
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

                const country = obj.Country;
                const region = obj.Region;
                const subRegion = obj['Sub-Region'];
                const branch = obj.Branch;
                const position = obj.Position;
                const accessRole = obj['Access role'];

                const parallelJobs = {};

                if (!position || !accessRole) {
                    return mapCb(null);
                }

                if (country) {
                    parallelJobs.country = (cb) => {
                        const countries = country
                            .split(',')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: countries,
                            },
                            type: 'country',
                        };

                        DomainModel.find(query).select('_id').lean().exec(cb);
                    };
                }

                if (region) {
                    parallelJobs.region = (cb) => {
                        const regions = region
                            .split(',')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: regions,
                            },
                            type: 'region',
                        };

                        DomainModel.find(query).select('_id').lean().exec(cb);
                    };
                }

                if (subRegion) {
                    parallelJobs.subRegion = (cb) => {
                        const subRegions = subRegion
                            .split(',')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: subRegions,
                            },
                            type: 'subRegion',
                        };

                        DomainModel.find(query).select('_id').lean().exec(cb);
                    };
                }

                if (branch) {
                    parallelJobs.branch = (cb) => {
                        const branches = branch
                            .split('|')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: branches,
                            },
                        };

                        BranchModel.find(query).select('_id').lean().exec(cb);
                    };
                }

                parallelJobs.position = (cb) => {
                    const query = {
                        'name.en': position.toUpperCase(),
                    };

                    PositionModel.findOne(query).select('_id').lean().exec(cb);
                };

                parallelJobs.accessRole = (cb) => {
                    const query = {
                        'name.en': accessRole,
                    };

                    AccessRoleModel.findOne(query).select('_id').lean().exec(cb);
                };

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

                    if (!patch.position || !patch.accessRole) {
                        return mapCb(null);
                    }

                    setStandardPasswordToYopmail(patch);

                    pathPersonnel({ patch }, mapCb);
                });
            }, cb);
        },

        (collection, cb) => {
            async.eachLimit(_.compact(collection), 10, (model, eachCb) => {
                // I want to find domain which has current ID as xlsParent
                const query = {
                    xlsManager: model.get('ID'),
                };
                // And update his relation to parent with current Mongo ID
                const patch = {
                    manager: model.get('_id'),
                    xlsManager: null,
                };

                PersonnelModel.update(query, patch, {
                    new: true,
                    multi: true,
                }, eachCb);
            }, cb);
        },

        cleanXlsParent,

    ], callback);
};
