const db = require('./../../utils/mongo');
const contentType = require('./../../public/js/constants/contentType').TASK_SCHEDULER;

module.exports = db.collection(contentType);
