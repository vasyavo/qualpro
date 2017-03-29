const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').DOMAIN;

module.exports = db.collection(`${contentType}s`);
