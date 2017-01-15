const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    scheduleId: {
        type: ObjectId,
        required: true
    },
    documentId : {
        type : ObjectId
    },
    functionName : {
        type: String,
        required: true
    },
    args: {
        type : Object,
        default : {}
    }
}, {
    collection: CONTENT_TYPES.TASK_SCHEDULER
});

module.exports = schema;
