const mongoose = require('mongoose');
const schema = require('./schema');
const contentType = 'session';

const model = mongoose.model(contentType, schema);

mongoose.Schemas[contentType] = schema;

module.exports = model;
