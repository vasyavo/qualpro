'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    objective: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES },
    person: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL }
}, {
    collection: 'objectiveHistories',
    timestamps: true
});

module.exports = schema;
