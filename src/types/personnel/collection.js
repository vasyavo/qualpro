const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').PERSONNEL;

module.exports = db.collection(`${contentType}s`);
