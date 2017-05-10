const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const schema = new Schema({
    _id: Number,
    name: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            efault: '',
        },
    },
    sequence: Number,
    hrefNotInHash: Boolean,
    href: {
        type: String,
        default: '',
    },
    users: {},
    parrent: Number,
    visible: Boolean,
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.MODULE}s`,
    versionKey: false,
});

module.exports = schema;
