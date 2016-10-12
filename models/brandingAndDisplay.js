module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var PROMOTION_STATUSES = OTHER_CONSTANTS.PROMOTION_STATUSES;

    var brandingAndDisplaySchema = mongoose.Schema({
        category     : [{type: ObjectId, ref: CONTENT_TYPES.CATEGORY}],
        country      : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN}],
        region       : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN}],
        subRegion    : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN}],
        retailSegment: [{type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT}],
        outlet       : [{type: ObjectId, ref: CONTENT_TYPES.OUTLET}],
        branch       : [{type: ObjectId, ref: CONTENT_TYPES.BRANCH}],
        displayType  : {
            type   : Number,
            ref    : CONTENT_TYPES.DISPLAYTYPE,
            default: 16
        },
        dateStart  : {type: Date},
        dateEnd    : {type: Date},
        attachments: {type: Array, default: []},
        description: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },
        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date}
        },
        status: {
            type   : String,
            enum   : [PROMOTION_STATUSES.DRAFT, PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.EXPIRED],
            default: PROMOTION_STATUSES.DRAFT
        },
        personnel: [{type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null}]
    }, {
        collection: 'brandingAndDisplay'
    });

    mongoose.model(CONTENT_TYPES.BRANDINGANDDISPLAY, brandingAndDisplaySchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.BRANDINGANDDISPLAY] = brandingAndDisplaySchema;
})();
