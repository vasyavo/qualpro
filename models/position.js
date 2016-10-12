module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var i = 0;

    function getNextSequence() {
        return i++;
    }

    var schema = mongoose.Schema({
        name              : {en: {type: String, unique: true}, ar: String},
        profileAccess     : [{
            module: {type: Number, ref: "modules"},
            access: {
                read     : {type: Boolean, default: false},
                editWrite: {type: Boolean, default: false},
                del      : {type: Boolean, default: false}
            }
        }],
        isArchived        : Boolean,
        description       : String,
        whoCanRW          : {type: String, enum: ['owner', 'group', 'everyOne'], default: 'owner'},
        groups            : {
            owner: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            users: [{type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null}],
            group: [{type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null}]
        },
        numberOfPersonnels: {type: Number, default: 0},
        createdBy         : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: Date.now}
        },
        editedBy          : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'positions'});

    mongoose.model(CONTENT_TYPES.POSITION, schema);

    schema.pre('save', function (next) {
        var doc = this;
        //todo Implement real autoincrement using mongo counters https://docs.mongodb.org/manual/tutorial/create-an-auto-incrementing-field/
        doc._id = getNextSequence();
        next();
    });

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.POSITION] = schema;
})();