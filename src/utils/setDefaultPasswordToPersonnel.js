const async = require('async');
const PersonnelCollection = require('./../types/personnel/collection');
const logger = require('./logger');
const PasswordManager = require('./../helpers/passwordManager');

const defaultPassword = '123456';
const hashPassword = PasswordManager.encryptPasswordSync(defaultPassword);

async.series([

    (cb) => {
        PersonnelCollection.updateMany({
            $or: [
                { pass: { $ne: null } },
                { pass: { $exists: false } },
            ],
        }, {
            $set: {
                pass: hashPassword,
            },
        }, cb);
    },

], (err) => {
    if (err) {
        logger.error(err);
        process.exit(1);
    }

    logger.info(`Default password ${defaultPassword} set to personnels`);
    process.exit(0);
});
