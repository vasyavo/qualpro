const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').ANDROID_VERSION;

module.exports = db.collection(`${contentType}s`);
