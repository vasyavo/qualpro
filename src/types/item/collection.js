const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').ITEM;

module.exports = db.collection(`${contentType}s`);
