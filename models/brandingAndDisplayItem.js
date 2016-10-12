module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');

    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var brandingAndDisplayItemSchema = mongoose.Schema({
        brandingAndDisplay: {type: ObjectId, ref: CONTENT_TYPES.BRANDINGANDDISPLAY, default: null},
        branch            : [{type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null}],
        comments          : [{type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null}],
        createdBy         : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date}
        }
    }, {collection: 'brandingAndDisplayItems'});

    mongoose.model(CONTENT_TYPES.BRANDINGANDDISPLAYITEMS, brandingAndDisplayItemSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.BRANDINGANDDISPLAYITEMS] = brandingAndDisplayItemSchema;
})();
