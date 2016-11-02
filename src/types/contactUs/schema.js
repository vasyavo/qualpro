const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    description       : {
        type: String
    },
    type       : {
        type: String
    },
    module       : {
        type: String
    },
    status    : {
        type: String
    },
    attachments : {
        type: ObjectId,
        ref: CONTENT_TYPES.FILES,
        default: null
    }
        ,
    createdBy   : {
        type   : ObjectId,
        ref    : CONTENT_TYPES.PERSONNEL,
        default: null
    },
    createdAt : {
        type   : Date
    }

}, {
    collection: 'contactUs'
});

module.exports = schema;
