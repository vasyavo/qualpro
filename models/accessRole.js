module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    /**
     * @constructor AccessRoleModel
     * @type {*|Schema}
     *
     * @property {Object} name
     * @property {String} name.en
     * @property {String} name.ar
     * @property {Object} createdBy
     * @property {String} createdBy.user ___reference___ to {@link PersonnelModel}
     * @property {Date} createdBy.date
     * @property {Object} editedBy
     * @property {String} editedBy.user ___reference___ to {@link PersonnelModel}
     * @property {Date} editedBy.date
     */

    var roleSchema = mongoose.Schema({
        name: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        level     : {type: Number},
        roleAccess: [{
            _id   : false,
            module: {type: Number, ref: 'modules'},
            cms   : {
                _id     : false,
                read    : {type: Boolean, default: false},
                edit    : {type: Boolean, default: false},
                write   : {type: Boolean, default: false},
                archive : {type: Boolean, default: false},
                evaluate: {type: Boolean, default: false},
                upload  : {type: Boolean, default: false}
            },
            mobile: {
                _id     : false,
                read    : {type: Boolean, default: false},
                edit    : {type: Boolean, default: false},
                write   : {type: Boolean, default: false},
                archive : {type: Boolean, default: false},
                evaluate: {type: Boolean, default: false},
                upload  : {type: Boolean, default: false}
            }
        }],
        createdBy : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy  : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'accessRoles'});

    roleSchema.index({name: 1}, {unique: true});

    mongoose.model(CONTENT_TYPES.ACCESSROLE, roleSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.ACCESSROLE] = roleSchema;
})();
