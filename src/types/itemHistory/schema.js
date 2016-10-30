const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

var schema = new Schema({
    item: { type: ObjectId, ref: CONTENT_TYPES.ITEM },
    ppt: { type: Number, min: 0, default: 0 },

    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: {
            type: Date,
            default: Date.now
        }
    }
}, { collection: 'itemsHistory' });

schema.pre('save', function(next) {
    this.ppt = Math.round(this.ppt * 100);
    next();
});

schema.pre('update', function() {
    var price = this._update.$set.ppt;

    if (this._update.$set && this._update.$set.ppt) {
        this.update({}, { $set: { ppt: Math.round(price * 100) } });
    }
});

schema.post('findOne', function(model) {
    var price = model.get('ppt');

    model.set('ppt', price / 100);
});

module.exports = schema;
