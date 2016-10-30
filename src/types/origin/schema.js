const Schema = require('mongoose').Schema;

const schema = new Schema({
    name: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    ID: String

}, { collection: 'origins' });

schema.index({ 'name.en': 1, 'name.ar': 1 }, { unique: true });

module.exports = schema;
