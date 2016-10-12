module.exports = (function () {
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        country      : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN, require: true},
        retailSegment: {type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, require: true},
        product      : {type: ObjectId, ref: CONTENT_TYPES.CATEGORY, require: true},
        configuration: {type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT + '.configurations', require: true},
        fileID       : {type: ObjectId, ref: CONTENT_TYPES.FILES, default: null, require: true},
        archived     : {type: Boolean, default: false},
        createdBy    : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: 'planograms'});

    mongoose.model('planogram', schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['planogram'] = schema;
})();