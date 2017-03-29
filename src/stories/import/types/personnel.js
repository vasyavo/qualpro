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
const aclRoleNames = require('./../../../constants/aclRolesNames');
const getLocation = require('./../../personnel/reusable-components/getLocation');
const getBranches = require('./../../personnel/reusable-components/getBranches');
const toString = require('./../../../utils/toString');

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

const defineRelations = ({
    patch = {},
    setCountry = [],
    setRegion = [],
    setSubRegion = [],
    setBranch = [],
    accessRoleLevel,
}, callback) => {
    const relations = {};

    async.waterfall([

        (cb) => {
            getLocation({
                setCountry,
                setRegion,
                setSubRegion,
            }, cb);
        },

        (result, cb) => {
            const groups = result.length ?
                result.slice().pop() : {
                    setCountry: [],
                    setRegion: [],
                    setSubRegion: [],
                };

            relations.setCountry = groups.setCountry.map(country => toString(country, '_id'));
            relations.setRegion = groups.setRegion.map(region => toString(region, '_id'));
            relations.setSubRegion = groups.setSubRegion.map(subRegion => toString(subRegion, '_id'));

            cb(null);
        },

        (cb) => {
            getBranches({
                setSubRegion,
                setBranch,
            }, cb);
        },

        (result, cb) => {
            const groups = result.length ?
                result.slice().pop() : {
                    setBranch: [],
                    setRetailSegment: [],
                    setOutlet: [],
                };

            relations.setBranch = groups.setBranch.map(branch => toString(branch, '_id'));

            cb(null);
        },

        (cb) => {
            switch (accessRoleLevel) {
                default:
                case aclRoleNames.MASTER_ADMIN:
                case aclRoleNames.MASTER_UPLOADER:
                case aclRoleNames.TRADE_MARKETER:
                    return cb(null, Object.assign({}, patch, {
                        country: [],
                        region: [],
                        subRegion: [],
                        branch: [],
                    }));
                case aclRoleNames.COUNTRY_ADMIN:
                case aclRoleNames.COUNTRY_UPLOADER:
                    return cb(null, Object.assign({}, patch, {
                        country: relations.setCountry,
                        region: [],
                        subRegion: [],
                        branch: [],
                    }));
                case aclRoleNames.AREA_MANAGER:
                    return cb(null, Object.assign({}, patch, {
                        country: relations.setCountry,
                        region: relations.setRegion,
                        subRegion: [],
                        branch: [],
                    }));
                case aclRoleNames.AREA_IN_CHARGE:
                    return cb(null, Object.assign({}, patch, {
                        country: relations.setCountry,
                        region: relations.setRegion,
                        subRegion: relations.setSubRegion,
                        branch: setBranch.length ? relations.setBranch : [],
                    }));
                case aclRoleNames.SALES_MAN:
                case aclRoleNames.MERCHANDISER:
                case aclRoleNames.CASH_VAN:
                    return cb(null, Object.assign({}, patch, {
                        country: relations.setCountry,
                        region: relations.setRegion,
                        subRegion: relations.setSubRegion,
                        branch: relations.setBranch,
                    }));
            }
        },

    ], callback);
};
const updateRelationsInExistingPersonnel = (options, callback) => {
    const {
        patch,
        existingPersonnel,
    } = options;

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
};
const createNewPersonnelWithRelations = (options, callback) => {
    const {
        patch,
    } = options;

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
};

const pathPersonnel = (options, callback) => {
    const {
        accessRoleLevel,
        patch,
    } = options;

    async.waterfall([

        (cb) => {
            const query = {
                $and: [{
                    archived: false,
                }, {
                    $or: [{
                        'firstName.en': patch.firstName.en,
                        'lastName.en': patch.lastName.en,
                    }],
                }],
            };

            PersonnelModel.findOne(query).exec(cb);
        },

        (existingPersonnel, cb) => {
            const pipeline = [
                (cb) => {
                    defineRelations({
                        patch,
                        accessRoleLevel,
                        setCountry: patch.country,
                        setRegion: patch.region,
                        setSubRegion: patch.subRegion,
                        setBranch: patch.branch,
                    }, cb);
                },
            ];

            if (existingPersonnel) {
                pipeline.push(
                    (patch, cb) => {
                        cb(null, {
                            patch,
                            existingPersonnel,
                        });
                    },
                    updateRelationsInExistingPersonnel
                );
            } else {
                pipeline.push(
                    (patch, cb) => {
                        cb(null, {
                            patch,
                        });
                    },
                    createNewPersonnelWithRelations
                );
            }

            async.waterfall(pipeline, cb);
        },

    ], callback);
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
                    parallelJobs.setCountry = (cb) => {
                        const countries = country
                            .split(',')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: countries,
                            },
                            type: 'country',
                            archived: false,
                        };

                        DomainModel.find(query).select('_id name').lean().exec(cb);
                    };
                }

                if (region) {
                    parallelJobs.setRegion = (cb) => {
                        const regions = region
                            .split(',')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: regions,
                            },
                            type: 'region',
                            archived: false,
                        };

                        DomainModel.find(query).select('_id name').lean().exec(cb);
                    };
                }

                if (subRegion) {
                    parallelJobs.setSubRegion = (cb) => {
                        const subRegions = subRegion
                            .split(',')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: subRegions,
                            },
                            type: 'subRegion',
                            archived: false,
                        };

                        DomainModel.find(query).select('_id name').lean().exec(cb);
                    };
                }

                if (branch) {
                    parallelJobs.setBranch = (cb) => {
                        const branches = branch
                            .split('|')
                            .map((item) => (item.trim()));
                        const query = {
                            'name.en': {
                                $in: branches,
                            },
                            archived: false,
                        };

                        BranchModel.find(query).select('_id name').lean().exec(cb);
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

                    AccessRoleModel.findOne(query).select('_id level').lean().exec(cb);
                };

                async.parallel(parallelJobs, (err, population) => {
                    if (err) {
                        return mapCb(err);
                    }

                    patch.country = Array.isArray(population.setCountry) ? population.setCountry : [];
                    patch.region = Array.isArray(population.setRegion) ? population.setRegion : [];
                    patch.subRegion = Array.isArray(population.setSubRegion) ? population.setSubRegion : [];
                    patch.branch = Array.isArray(population.setBranch) ? population.setBranch : [];
                    patch.position = population.position ?
                        population.position._id : null;
                    patch.accessRole = population.accessRole ?
                        population.accessRole._id : null;

                    if (!patch.position || !patch.accessRole) {
                        return mapCb(null);
                    }

                    setStandardPasswordToYopmail(patch);

                    pathPersonnel({
                        accessRoleLevel: population.accessRole ?
                            population.accessRole.level : null,
                        patch,
                    }, mapCb);
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
