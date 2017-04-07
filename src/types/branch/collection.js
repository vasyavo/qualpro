const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').BRANCH;

module.exports = db.collection(`${contentType}es`);
