const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').OUTLET;

module.exports = db.collection(`${contentType}s`);
