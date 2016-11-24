const Schema = require('mongoose').Schema;

const schema = new Schema({
    name: {
        en: {type: String},
        ar: {type: String}
    }
}, {
    collection: 'displayTypes'
});

module.exports = schema;
