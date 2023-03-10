const mongoose = require('mongoose');
const schema = require('./schema');
const contentType = require('./../../public/js/constants/contentType').PREVIEW;

const model = mongoose.model(contentType, schema);

module.exports = model;
