const bcrypt = require('bcryptjs');
const async = require('async');
const passwordGenerator = require('generate-password');

const generatePassword = () => {
   return passwordGenerator.generate({
       length: 10,
       numbers: true,
       uppercase : true,
       strict: true
   });
};

const encryptPasswordSync = (password) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    return hash;
};

const encryptPassword = (password, callback) => {
    async.waterfall([

        async.apply(bcrypt.genSalt, 10),

        async.apply(bcrypt.hash, password)

    ], callback);
};

module.exports = {
    generatePassword,
    encryptPasswordSync,
    encryptPassword
};
