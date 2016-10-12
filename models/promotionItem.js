module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var promotionItemSchema = mongoose.Schema({
        promotion: {type: ObjectId, ref: CONTENT_TYPES.PROMOTIONS, default: null},
        outlet   : {type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null},
        branch   : {type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null},
        dateStart: {type: Date},
        dateEnd  : {type: Date},
        rsp      : {type: Number, default: 0},
        status   : {
            type   : String,
            enum   : [PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.EXPIRED],
            default: PROMOTION_STATUSES.ACTIVE
        },
        opening     : [{type: Number, default: 0}],
        sellIn      : [{type: Number, default: 0}],
        closingStock: [{type: Number, default: 0}],
        sellOut     : [{type: Number, default: 0}],
        displayType : {
            type   : Number,
            ref    : CONTENT_TYPES.DISPLAYTYPE,
            default: 16
        },
        comment  : {type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null},
        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: 'promotionsItems'});

    mongoose.model(CONTENT_TYPES.PROMOTIONSITEMS, promotionItemSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.PROMOTIONSITEMS] = promotionItemSchema;
})();
