module.exports = (function () {
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        personnelId: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, required: true},
        questionnariId: {type: ObjectId, ref: CONTENT_TYPES.QUESTIONNARIES, required: true},
        questionId: {type: ObjectId, ref: CONTENT_TYPES.QUESTIONNARIES.questions, required: true},
        answerIndex: {type: Number, required: true},
        createdBy    : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy     : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'personnelAnswers'});

    mongoose.model('personnelAnswers', schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['personnelAnswers'] = schema;
})();