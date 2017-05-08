const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    headers: {
        contentType : {
            type: String,
            required: true
        },
        actionType : {
            type: String,
            required: true
        },
        user : {
            type: ObjectId,
            required: true
        },
        reportId : {
            type: ObjectId,
            required: false
        }
    },
    payload: {}
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.EVENT}s`,
    versionKey: false,
});

module.exports = schema;
