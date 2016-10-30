'use strict';

const Schema = require('mongoose').Schema;

const schema = new Schema({
    _id: Number,
    priority: String
}, { collection: 'priorities' });

module.exports = schema;
