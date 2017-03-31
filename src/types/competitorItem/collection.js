const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').COMPETITORITEM;

module.exports = db.collection(`${contentType}s`);
