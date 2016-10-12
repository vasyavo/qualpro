module.exports = (function () {
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema({

        objective : {type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES},
        person    : {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL}
    }, {
        collection: 'objectiveHistories',
        timestamps: true
    });


    mongoose.model(CONTENT_TYPES.OBJECTIVEHISTORY, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.OBJECTIVEHISTORY] = schema;
})();