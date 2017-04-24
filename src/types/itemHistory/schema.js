const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    headers: {
        contentType: { type: String, enum: ['item'] },
        actionType: { type: String, enum: ['itemChanged'] },
        itemId: { type: ObjectId },
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
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
