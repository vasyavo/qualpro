module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema(
        {
            itemName       : {
                en: {type: String},
                ar: {type: String}
            },
            country        : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN}],
            region         : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN}],
            subRegion      : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN}],
            branch         : [{type: ObjectId, ref: CONTENT_TYPES.BRANCH}],
            retailSegment  : [{type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT}],
            outlet         : [{type: ObjectId, ref: CONTENT_TYPES.OUTLET}],
            assignedTo     : [{type: ObjectId, ref: CONTENT_TYPES.PERSONNEL}],
            itemId         : {type: ObjectId},
            itemDetails    : {type: String, default: ''},
            itemType       : {type: String, default: ''},
            accessRoleLevel: {type: Number},
            module         : {type: Number},
            actionType     : {type: String, default: ''},
            creationDate   : {type: Date, default: new Date()},
            personnels     : [{type: ObjectId, ref: CONTENT_TYPES.PERSONNEL}],
            createdBy      : {
                user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
                date: {type: Date, default: new Date()}
            }

        }, {collection: 'activityLists'});

    mongoose.model(CONTENT_TYPES.ACTIVITYLIST, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.ACTIVITYLIST] = schema;
})();
