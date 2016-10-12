module.exports = (function () {
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        personnelId   : {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, require: true},
        questionnaryId: {type: ObjectId, ref: CONTENT_TYPES.QUESTIONNARIES, require: true},
        questionId    : {type: ObjectId, ref: CONTENT_TYPES.QUESTIONNARIES.questions, require: true},
        country       : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null},
        region        : {type: ObjectId, ref: CONTENT_TYPES.REGION, default: null},
        subRegion     : {type: ObjectId, ref: CONTENT_TYPES.SUBREGION, default: null},
        retailSegment : {type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, default: null},
        outlet        : {type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null},
        branch        : {type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null},
        optionIndex   : [{type: Number}],
        text          : {
            en: {type: String},
            ar: {type: String}
        },
        createdBy     : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        editedBy      : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: CONTENT_TYPES.QUESTIONNARIES_ANSWER});

    mongoose.model(CONTENT_TYPES.QUESTIONNARIES_ANSWER, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.QUESTIONNARIES_ANSWER] = schema;
})();