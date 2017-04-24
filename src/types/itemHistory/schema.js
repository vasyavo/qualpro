const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    headers: {
        contentType: { type: String, enum: ['item'] },
        actionType: { type: String, enum: ['itemChanged'] },
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    payload: {},
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.ITEMHISTORY,
    versionKey: false,
});

module.exports = schema;
