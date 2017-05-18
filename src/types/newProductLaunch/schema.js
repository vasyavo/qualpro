const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    additionalComment: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    category: {
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY,
        default: null,
    },
    category_name: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    brand: {
        _id: {
            type: ObjectId,
            ref: CONTENT_TYPES.BRAND,
        },
        name: {
            type: String,
            default: '',
        },
        custom: {
            type: Number,
            default: 0,
        },
    },
    variant: {
        _id: {
            type: ObjectId,
            ref: CONTENT_TYPES.COMPETITORVARIANT,
        },
        name: {
            type: String,
            default: '',
        },
        custom: {
            type: Number,
            default: 0,
        },
    },
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    region: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    subRegion: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    retailSegment: {
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
        default: null,
    },
    outlet: {
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET,
        default: null,
    },
    branch: {
        type: ObjectId,
        ref: CONTENT_TYPES.BRANCH,
        default: null,
    },
    origin: {
        type: ObjectId,
        ref: CONTENT_TYPES.ORIGIN,
        default: null,
    },
    price: {
        type: String,
        default: '',
    },
    packing: {
        type: String,
        default: '',
    },
    packingType: {
        type: String,
        enum: ['GM', 'ML', ''],
        default: '',
    },
    location: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    displayType: [{
        type: ObjectId,
        ref: CONTENT_TYPES.DISPLAYTYPE,
        default: null,
    }],
    distributor: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    shelfLifeStart: Date,
    shelfLifeEnd: Date,
    shelfLife: {
        type: String,
        default: null,
    },
    attachments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
        }],
        default: [],
    },
    archived: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    editedBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.NEWPRODUCTLAUNCH}es`,
    versionKey: false,
});

module.exports = schema;
