const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const defaults = require('./../../constants/defaultImageSrc');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    base64: {
        type: String,
        required: true,
    },
    domain: {
        type: ObjectId,
        required: true,
    },
    module: {
        type: Number,
        required: true,
    },
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.PREVIEW,
    versionKey: false,
});

module.exports = schema;
