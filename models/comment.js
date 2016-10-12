module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({

        /**
         * @constructor CommentModel
         * @type {*|Schema}
         *
         * @property {String} body
         * @property {ObjectId} taskId (objective, instore task, competitor branding)
         * @property {Array} attachments
         * @property {Bool} isArchived
         * @property {Object} createdBy
         * @property {String} createdBy.user ___reference___ to {@link PersonnelModel}
         * @property {Date} createdBy.date
         * @property {Object} editedBy
         * @property {String} editedBy.user ___reference___ to {@link PersonnelModel}
         * @property {Date} editedBy.date

         */

        body       : {type: String, require: true},
        taskId     : {type: ObjectId, default: null},
        attachments: {type: Array, default: [], ref: CONTENT_TYPES.FILES},
        isArchived : {type: Boolean, default: false},
        createdBy  : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: 'comments'});

    mongoose.model(CONTENT_TYPES.COMMENT, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.COMMENT] = schema;
})();