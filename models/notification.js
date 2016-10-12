module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var notificationSchema = mongoose.Schema({
        country      : [{type: ObjectId, ref: CONTENT_TYPES.COUNTRY, require: true}],
        region       : [{type: ObjectId, ref: CONTENT_TYPES.REGION, default: null}],
        subRegion    : [{type: ObjectId, ref: CONTENT_TYPES.SUBREGION, default: null}],
        retailSegment: [{type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, default: null}],
        outlet       : [{type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null}],
        branch       : [{type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null}],
        position     : [{type: ObjectId, ref: CONTENT_TYPES.POSITION, default: null}],
        recipients   : [{type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null}],
        description  : {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },
        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {
        collection: 'notifications'
    });

    mongoose.model(CONTENT_TYPES.NOTIFICATIONS, notificationSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.NOTIFICATIONS] = notificationSchema;
})();
