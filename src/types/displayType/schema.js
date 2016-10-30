const Schema = require('mongoose').Schema;

const schema = new Schema({
    _id : {type: Number},
    name: {
        en: {type: String},
        ar: {type: String}
    }
}, {collection: 'displayTypes'});

module.exports = schema;
