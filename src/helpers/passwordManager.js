const bcrypt = require('bcryptjs');

const generatePassword = () => {
   return bcrypt.genSaltSync(10)
};

module.exports = {
    generatePassword
};
