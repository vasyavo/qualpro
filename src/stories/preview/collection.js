const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').PREVIEW;

module.exports = db.collection(contentType);
