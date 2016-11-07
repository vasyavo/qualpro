const async = require('async');
const logger = require('./../utils/logger');
const AccessRoleModel = require('./../types/accessRole/model');
const levels = {
    'Master Admin': 1,
    'Country Admin': 2,
    'Area Manager': 3,
    'Area in charge': 4,
    'Sales Man': 5,
    'Merchandiser': 6,
    'Cash van': 7,
    'Master uploader': 8,
    'Country uploader': 9
};

const generate = (callback) => {
    async.waterfall([

        (cb) => {
            AccessRoleModel
                .find({}, cb);
        },

        (collection, cb) => {
            async.each(collection, (model, eachCb) => {
                const name = model.get('name.en');
                const level = levels[name];

                model.update({
                    $set: {
                        level
                    }
                }, eachCb);
            }, cb);
        }

    ], (err) => {
        if (err) {
            logger.error('Fail to update levels in access roles!', err);
            return callback(err);
        }

        logger.info('Update is completed for levels in access roles.');
        callback();
    });
};

module.exports = {
    generate
};
