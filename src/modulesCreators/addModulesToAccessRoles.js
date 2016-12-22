const async = require('async');
const logger = require('../utils/logger');
const AccessRoleModel = require('../types/accessRole/model');

const superAdmin = require('./roles/superAdmin');
const masterAdmin = require('./roles/masterAdmin');
const countryAdmin = require('./roles/countryAdmin');
const areaManager = require('./roles/areaManager');
const areaInChargeManager = require('./roles/areaInChargeManager');
const salesman = require('./roles/salesman');
const merchandiser = require('./roles/merchandiser');
const cashVan = require('./roles/cashVan');
const masterUpload = require('./roles/masterUploader');
const countryUpload = require('./roles/countryUploader');
const tradeMarketer = require('./roles/tradeMarketer');

// sequence is important
const accessRolesData = [
    superAdmin,
    masterAdmin,
    countryAdmin,
    areaManager,
    areaInChargeManager,
    salesman,
    merchandiser,
    cashVan,
    masterUpload,
    countryUpload,
    tradeMarketer
];

const accessRoles = [];

for (let level in accessRolesData) {
    const roleAccess = accessRolesData[level];

    accessRoles.push({
        roleAccess
    });
}

// sequence is important
const levels = [
    'Super Admin',
    'Master Admin',
    'Country Admin',
    'Area Manager',
    'Area in charge',
    'Sales Man',
    'Merchandiser',
    'Cash van',
    'Master uploader',
    'Country uploader',
    'Trade marketer'
];

const generate = (callback) => {
    async.waterfall([

        (cb) => {
            AccessRoleModel.update({}, {
                $set: {
                    roleAccess: []
                }
            }, {
                multi: true
            }, cb);
        },

        (result, cb) => {
            async.eachOf(accessRolesData, (roleAccess, level, eachCb) => {
                const name = levels[level];
                const query = {
                    'name.en': name
                };
                const patch = {
                    $set: {
                        'name.en': name,
                        level,
                    },
                    $pushAll: {
                        roleAccess: roleAccess
                    }
                };
                const options = {
                    new: true,
                    upsert: true,
                    runValidators: true
                };

                // see https://jira.mongodb.org/browse/SERVER-1947
                AccessRoleModel.findOneAndUpdate(query, patch, options, (err, model) => {
                    if (err) {
                        return eachCb(err);
                    }

                    if (model) {
                        // tip: goal of it that we cat use it in tests.
                        accessRoles[level].id = model._id.toString();
                    }

                    eachCb(null, model);
                });
            }, cb);
        }

    ], (err) => {
        if (err) {
            logger.error('Fail to setup access roles!', err);
            return callback(err);
        }

        logger.info('Setup is done for access roles.');
        callback();
    });
};

module.exports = {
    generate,
    accessRoles
};
