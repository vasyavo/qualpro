const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    additionalComment: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    category: { type: ObjectId, ref: CONTENT_TYPES.CATEGORY, default: null },
    category_name: {
        en: { type: String, default: '',},
        ar: { type: String, default: ''}
    },
    brand: {
        _id: { type: ObjectId, ref: CONTENT_TYPES.BRAND },
        name: { type: String, default: '' }
    },
    variant: {
        _id: { type: ObjectId, ref: CONTENT_TYPES.COMPETITORVARIANT },
        name: { type: String, default: '' }
    },
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    region: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    subRegion: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    retailSegment: { type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT },
    outlet: { type: ObjectId, ref: CONTENT_TYPES.OUTLET },
    branch: { type: ObjectId, ref: CONTENT_TYPES.BRANCH },
    origin: { type: ObjectId, ref: CONTENT_TYPES.ORIGIN },
    price: { type: String, default: '' },
    packing: { type: String, default: '' },
    location: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    displayType: [{
        type: Number,
        ref: CONTENT_TYPES.DISPLAYTYPE,
        default: 16
    }],
    distributor: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    shelfLifeStart: Date,
    shelfLifeEnd: Date,
    shelfLife: { type: String, default: null },
    attachments: { type: Array, default: [] },
    archived: {
        type: Boolean,
        default: false
    },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: {
            type: Date,
            default: new Date()
        }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: {
            type: Date,
            default: new Date()
        }
    }
}, { collection: 'newProductLaunches' });

module.exports = schema;
