const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    base64: {
        type: String,
        required: true,
    },
    itemId: {
        type: ObjectId,
        default: null,
    },
    contentType: {
        type: String,
        required: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.PREVIEW,
    versionKey: false,
});

module.exports = schema;
