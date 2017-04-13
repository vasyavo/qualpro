const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    objective: {
        type: ObjectId,
        ref: CONTENT_TYPES.OBJECTIVES,
    },
    person: {
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
    },
}, {
    autoIndex: false,
    collection: 'objectiveHistories',
    versionKey: false,
    timestamps: true,
});

module.exports = schema;
