const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    country: [{ type: ObjectId, ref: CONTENT_TYPES.COUNTRY, require: true }],
    region: [{ type: ObjectId, ref: CONTENT_TYPES.REGION, default: null }],
    subRegion: [{ type: ObjectId, ref: CONTENT_TYPES.SUBREGION, default: null }],
    retailSegment: [{ type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, default: null }],
    outlet: [{ type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null }],
    branch: [{ type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null }],
    position: [{ type: ObjectId, ref: CONTENT_TYPES.POSITION, default: null }],
    recipients: [{ type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null }],
    description: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }
}, {
    collection: 'notifications'
});

module.exports = schema;
