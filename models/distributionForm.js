module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var ObjectId = Schema.Types.ObjectId;

    var branchData = new Schema({
        // outlet   : {type: ObjectId, ref: CONTENT_TYPES.OUTLET, required: true},
        branch   : {type: ObjectId, ref: CONTENT_TYPES.BRANCH, required: true},
        indicator: {type: String, enum: ['y', 'n']}
    }, {_id: false});

    var itemData = new Schema({
        category: {type: ObjectId, ref: CONTENT_TYPES.CATEGORY, required: true},
        variant : {type: ObjectId, ref: CONTENT_TYPES.VARIANT, required: true},
        item    : {type: ObjectId, ref: CONTENT_TYPES.ITEM, required: true},
        branches: [branchData]
    }, {_id: false});

    var schema = new Schema({
        objective: {type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, required: true},
        branches : [{type: ObjectId, ref: CONTENT_TYPES.BRANCH}],
        items    : [itemData],
        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }

    }, {collection: 'distributionForms'});

    mongoose.model(CONTENT_TYPES.DISTRIBUTIONFORM, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.DISTRIBUTIONFORM] = schema;
})();
