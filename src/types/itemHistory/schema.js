const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');

const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
    item: {
        type: ObjectId,
        ref: CONTENT_TYPES.ITEM,
        default: null,
    },
    ppt: {
        type: Number,
        min: 0,
        default: 0,
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
}, {
    autoIndex: false,
    collection: CONTENT_TYPES.ITEMHISTORY,
    versionKey: false,
});

schema.pre('save', function(next) {
    this.ppt = Math.round(this.ppt * 100);

    next();
});

schema.pre('update', function() {
    const price = this._update.$set.ppt;

    if (this._update.$set && this._update.$set.ppt) {
        this.update({}, {
            $set: {
                ppt: Math.round(price * 100),
            },
        });
    }
});

schema.post('findOne', function(model) {
    const price = model.get('ppt');

    model.set('ppt', price / 100);
});

module.exports = schema;
