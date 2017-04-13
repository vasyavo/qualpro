const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const schema = new Schema({
    name: {
        en: {
            type: String,
        },
        ar: {
            type: String,
        },
    },
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.DISPLAY_TYPE}s`,
    versionKey: false,
});

module.exports = schema;
