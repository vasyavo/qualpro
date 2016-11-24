const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');
const ItemHistoryModel = require('./../itemHistory/model');

const LocationSchema = new Schema({
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    retailSegment: { type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT },
    outlet: { type: ObjectId, ref: CONTENT_TYPES.OUTLET }
}, {
    _id: false
});

const schema = new Schema({
    name: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    barCode: { type: String, default: '' },
    packing: { type: String, default: '' },
    ppt    : {type: Number, min: 0, default: 0}, //TODO: review field PPT (product item model)
    pptPerCase : {type: Number, min: 0, default: 0},
    rspMin : {type: Number, min: 0, default: 0},
    rspMax : {type: Number, min: 0, default: 0},
    origin: [{ type: ObjectId, ref: CONTENT_TYPES.ORIGIN }],
    category: { type: ObjectId, ref: CONTENT_TYPES.CATEGORY },
    variant: { type: ObjectId, ref: CONTENT_TYPES.VARIANT },
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    location: [LocationSchema],
    archived: {
        type: Boolean,
        default: false
    },
    topArchived: { type: Boolean, default: false },
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
}, { collection: 'items' });
schema.pre('save', function(next) {
    this.ppt = Math.round(this.ppt * 100);
    this.rspMin = Math.round(this.rspMin * 100);
    this.rspMax = Math.round(this.rspMax * 100);
    this.pptPerCase = Math.round(this.pptPerCase * 100);
    next();
});

schema.pre('update', function(next) {
    if (this._update.$set && this._update.$set.ppt) {
        const item = this._conditions._id;
        const price = this._update.$set.ppt;
        const rspMin = this._update.$set.rspMin;
        const rspMax = this._update.$set.rspMax;
        const pptPerCase = this._update.$set.pptPerCase;
        const createdBy = this._update.$set.editedBy;

        this.update({}, {
            $set: {
                ppt: Math.round(price * 100),
                rspMin: Math.round(rspMin * 100),
                rspMax: Math.round(rspMax * 100),
                pptPerCase: Math.round(pptPerCase * 100),
            }
        });

        return ItemHistoryModel.create({
            item: item,
            ppt: price,
            rspMin: rspMin,
            rspMax: rspMax,
            pptPerCase: pptPerCase,
            createdBy: createdBy
        }, function(err) {
            if (err) {
                return next(err);
            }

            next();
        });
    }

    next();
});

schema.post('findOne', function(model) {
    var price = model.get('ppt'),
        rspMin = model.get('rspMin'),
        rspMax = model.get('rspMax'),
        pptPerCase = model.get('pptPerCase');

    model.set({
        'ppt': price,
        'rspMin': rspMin,
        'rspMax': rspMax,
        'pptPerCase': pptPerCase
    });

});

module.exports = schema;
