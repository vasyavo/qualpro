const mongoose = require('mongoose');
const schema = require('./schema');
const contentType = require('./../../public/js/constants/contentType').BRANDING_AND_MONTHLY_DISPLAY;

const model = mongoose.model(contentType, schema);

mongoose.Schemas[contentType] = schema;

module.exports = model;
