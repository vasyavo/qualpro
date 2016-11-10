const passwordGenerator = require('generate-password');

const generatePassword = () => {
   return passwordGenerator.generate({
       length: 10,
       numbers: true,
       uppercase : true,
       strict: true
   });
};

module.exports = {
    generatePassword
};
