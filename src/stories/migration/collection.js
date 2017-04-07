const db = require('./../../utils/mongo');

const collection = db.collection('migration-map');

module.exports = collection;

