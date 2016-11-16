'use strict';
const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    description : {
        type : String
    },
    type : {
        type : String
    },
    status : {
        type : String
    },
    comments : {
        type : Array,
        default : []
    },
    attachments : { type: Array, default: [] },
    createdBy : {
        type : ObjectId,
        ref : CONTENT_TYPES.PERSONNEL,
        default : null
    },
    createdAt : {
        type : Date
    }

}, {
    collection : 'contactUs'
});

module.exports = schema;
