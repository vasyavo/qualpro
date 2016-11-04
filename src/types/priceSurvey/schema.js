'use strict';

const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    category: { type: ObjectId, ref: CONTENT_TYPES.CATEGORY },
    variant: { type: ObjectId, ref: CONTENT_TYPES.COMPETITORVARIANT },
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    region: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    subRegion: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN },
    retailSegment: { type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT },
    outlet: { type: ObjectId, ref: CONTENT_TYPES.OUTLET },
    branch: { type: ObjectId, ref: CONTENT_TYPES.BRANCH },
    items: [{
        _id: false,
        brand: { type: ObjectId, ref: CONTENT_TYPES.BRAND },
        size: { type: String },
        price: { type: Number, min: 0, default: 0 }
    }],
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: {
            type: Date,
            default: new Date()
        }
    }
}, { collection: 'priceSurveys' });

let i = 0;

function getNextSequence() {
    return i++;
}

schema.pre('save', function(next) {
    var doc = this;
    //todo Implement real autoincrement using mongo counters https://docs.mongodb.org/manual/tutorial/create-an-auto-incrementing-field/
    doc._id = getNextSequence();
    next();
});


module.exports = schema;
