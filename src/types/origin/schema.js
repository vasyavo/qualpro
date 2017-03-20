const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const schema = new Schema({
    ID: {
        type: String,
        default: '',
    },
    name: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.ORIGIN}s`,
    versionKey: false,
});

schema.index({ 'name.en': 1 }, { unique: true });
schema.index({ 'name.ar': 1 }, { unique: true });

module.exports = schema;
