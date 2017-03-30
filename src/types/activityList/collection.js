const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').ACTIVITYLIST;

module.exports = db.collection(`${contentType}s`);
