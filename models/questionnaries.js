module.exports = (function () {
    var mongoose = require('mongoose');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = new mongoose.Schema({
        title   : {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },
        dueDate : {type: Date, default: new Date()},
        status  : {type: String, enum: ['draft', 'active', 'completed']},
        location: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        country: [
            {
                type: ObjectId,
                ref : CONTENT_TYPES.DOMAIN
            }
        ],

        region: [
            {
                type: ObjectId,
                ref : CONTENT_TYPES.DOMAIN
            }
        ],

        subRegion: [
            {
                type: ObjectId,
                ref : CONTENT_TYPES.DOMAIN
            }
        ],

        retailSegment: [
            {
                type: ObjectId,
                ref : CONTENT_TYPES.RETAILSEGMENT
            }
        ],

        outlet: [
            {
                type: ObjectId,
                ref : CONTENT_TYPES.OUTLET
            }
        ],

        branch: [
            {
                type: ObjectId,
                ref : CONTENT_TYPES.BRANCH
            }
        ],

        personnels: [
            {
                type: ObjectId,
                ref : CONTENT_TYPES.PERSONNEL
            }
        ],

        countAll     : {type: Number, default: 0},
        countBranches: {type: Number, default: 0},
        countAnswered: {type: Number, default: 0},
        questions    : [
            {
                title  : {
                    en: {type: String, default: ''},
                    ar: {type: String, default: ''}
                },
                type   : {type: String, enum: ['singleChoice', 'multiChoice', 'fullAnswer']},
                options: [
                    {
                        en: {type: String},
                        ar: {type: String}
                    }
                ]
            }
        ],

        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: CONTENT_TYPES.QUESTIONNARIES});

    mongoose.model(CONTENT_TYPES.QUESTIONNARIES, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.QUESTIONNARIES] = schema;
})();
