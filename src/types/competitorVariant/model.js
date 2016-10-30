const mongoose = require('mongoose');
const schema = require('./schema');
const contenType = require('./../../public/js/constants/contentType.js').COMPETITORVARIANT;

const model = mongoose.model(contenType, schema);

mongoose.Schemas[contenType] = schema;

module.exports = model;
