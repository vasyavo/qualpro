const Schema = require('mongoose').Schema;

const schema = new Schema({
    _id : {type: String, unique: true},
    name: {type: String, default: 'All'}
}, {collection: 'currencies'});

module.exports = schema;
