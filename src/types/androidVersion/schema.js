const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');


const schema = new Schema({
    version: {
        type: String
    },
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.ANDROID_VERSION}s`,
    versionKey: false,
});

module.exports = schema;
