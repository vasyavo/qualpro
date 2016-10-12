module.exports = (function () {
    'use strict';

    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var objective = new mongoose.Schema({
        _id   : {type: ObjectId, required: true},
        title : {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },
        status: {
            type    : String,
            enum    : [OBJECTIVE_STATUSES.DRAFT, OBJECTIVE_STATUSES.IN_PROGRESS, OBJECTIVE_STATUSES.OVER_DUE, OBJECTIVE_STATUSES.TO_BE_DISCUSSED, OBJECTIVE_STATUSES.FAIL, OBJECTIVE_STATUSES.COMPLETED, OBJECTIVE_STATUSES.CLOSED, OBJECTIVE_STATUSES.RE_OPENED, OBJECTIVE_STATUSES.ARCHIVED],
            required: true
        }
    });

    var report = new mongoose.Schema({
        _id : {type: ObjectId, required: true},
        type: {type: String, required: true},
        date: {type: Date, required: true}
    });

    var schema = new mongoose.Schema({
        personnel: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, required: true},
        type     : {
            type   : String,
            enum   : ['monthly', 'biYearly'],
            default: 'monthly'
        },
        rating   : {type: Number, min: 1, max: 5, required: true},
        month    : {type: Number, min: 1, max: 12, required: true},
        year     : {type: Number, min: 1970, required: true},
        time     : {
            type    : String,
            enum    : ['spring', 'fall'],
            required: true
        },
        dataKey  : {type: String},

        individualObjectives: [objective],
        companyObjectives   : [objective],
        inStoreTasks        : [objective],
        submittingReports   : [report],

        target: {type: Number, min: 0, required: true},
        achiev: {type: Number, min: 0, required: true},
        age   : {type: Number, min: 0, required: true},

        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, required: true},
            date: {type: Date, default: Date.now}
        },
        editedBy : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL},
            date: {type: Date, default: Date.now}
        }
    }, {collection: 'monthlies'});

    schema.pre('validate', function (next) {
        if (this.type === 'monthly') {
            this.time = (this.month <= 6) ? 'spring' : 'fall';
        } else {
            this.month = (this.time === 'spring') ? 6 : 12;
        }

        this.dataKey = this.year * 100 + this.month;
        this.age = Math.round(this.achiev / this.target * 100);
        next();
    });

    mongoose.model(CONTENT_TYPES.MONTHLY, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.MONTHLY] = schema;
})();