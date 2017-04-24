const _ = require('lodash');
const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const LocationSchema = new Schema({
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
    },
    retailSegment: {
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
    },
    outlet: {
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET,
    },
}, {
    _id: false,
});

const schema = new Schema({
    ID: {
        type: String,
    },
    name: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    barCode: {
        type: String,
        default: '',
    },
    packing: {
        type: String,
        default: '',
    },
    ppt: {
        type: Number,
        min: 0,
        default: 0,
    },
    pptPerCase: {
        type: Number,
        min: 0,
        default: 0,
    },
    rspMin: {
        type: Number,
        min: 0,
        default: 0,
    },
    rspMax: {
        type: Number,
        min: 0,
        default: 0,
    },
    origin: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.ORIGIN,
        }],
        default: [],
    },
    category: {
        type: ObjectId,
        ref: CONTENT_TYPES.CATEGORY,
        default: null,
    },
    variant: {
        type: ObjectId,
        ref: CONTENT_TYPES.VARIANT,
        default: null,
    },
    country: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        default: null,
    },
    location: [LocationSchema],
    archived: {
        type: Boolean,
        default: false,
    },
    topArchived: {
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
    collection: `${CONTENT_TYPES.ITEM}s`,
    versionKey: false,
});

schema.pre('save', function(next) {
    this.ppt = Math.round(this.ppt * 100);
    this.rspMin = Math.round(this.rspMin * 100);
    this.rspMax = Math.round(this.rspMax * 100);
    this.pptPerCase = Math.round(this.pptPerCase * 100);

    next();
});

schema.post('findOne', (model, next) => {
    if (model) {
        const price = model.get('ppt');
        const rspMin = model.get('rspMin');
        const rspMax = model.get('rspMax');
        const pptPerCase = model.get('pptPerCase');

        if (_.isInteger(price)) {
            model.set({
                ppt: price,
                rspMin,
                rspMax,
                pptPerCase,
            });
        }
    }

    next();
});

module.exports = schema;
