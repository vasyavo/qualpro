const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    personnelId: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, required: true },
    questionnariId: { type: ObjectId, ref: CONTENT_TYPES.QUESTIONNARIES, required: true },
    questionId: { type: ObjectId, ref: CONTENT_TYPES.QUESTIONNARIES.questions, required: true },
    answerIndex: { type: Number, required: true },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: Date.now }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: Date.now }
    }
}, { collection: 'personnelAnswers' });

module.exports = schema;
