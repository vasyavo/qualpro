module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');

    var prioritySchema = mongoose.Schema({
        _id: Number,
        priority: String
    }, { collection: 'priorities' });

    mongoose.model(CONTENT_TYPES.PRIORITY, prioritySchema);

    if(!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.PRIORITY] = prioritySchema;
})();