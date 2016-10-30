'use strict';

const Schema = require('mongoose').Schema;

const schema = new Schema({
    session: {
        type: String
    },
    expires: {
        type: Date
    }
}, {
    collection: 'sessions'
});

module.exports = schema;
