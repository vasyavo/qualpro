module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var OTHER_CONSTANTS = require('../public/js/constants/otherConstants.js');
    var OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var objectiveSchema = mongoose.Schema({

        /**
         * @constructor ObjectiveModel
         * @type {*|Schema}
         *
         * @property {Object} title _title_
         * @property {String} title.en
         * @property {String} title.ar
         * @property {Object} companyObjective _Company Objective description_
         * @property {String} companyObjective.en
         * @property {String} companyObjective.ar
         * @property {Object} description _description_ of _Objective_
         * @property {String} description.en
         * @property {String} description.ar
         * @property {String} objectiveType _enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Individual']_
         * @property {String} priority _enum: ['Low', 'Medium', 'High', 'Urgent']_ default: 'Low'
         * @property {String} status _enum: ['draft', 'inProgress', 'overDue', 'toBeDiscussed', 'fail', 'completed', 'closed', 'reOpened']_ default: 'draft'
         * @property {Array} assignedTo Array of ObjectIds [___reference___] to {@link PersonnelModel}
         * @property {Number} complete _Progress from 0 to 100_
         * @property {Object} parent _any key ___reference___ _ to {@link ObjectiveModel}. Show if objective have it's parent objectives by their levels
         * @property {ObjectId} parent.1
         * @property {ObjectId} parent.2
         * @property {ObjectId} parent.3
         * @property {ObjectId} parent.4
         * @property {Number} level The level of objective, depends on user accessRole
         * @property {Number} countSubTasks Count of subObjectives created from this objective, default: 0
         * @property {Number} completedSubTasks Count of completed subObjectives, default: 0
         * @property {Date} dateStart Date when objective starts
         * @property {Date} dateEnd Date when objective must be completed
         * @property {Date} dateClosed Date when objective exactly was closed
         * @property {Array} comments Array of ObjectIds [___reference___] to {@link CommentModel}
         * @property {Array} attachments Array of files ids attached to objective
         * @property {Object} form
         * @property {ObjectId} form._id ___reference___ to {@link DistributionFormModel} or {@link VisibilityFormModel}
         * @property {String} form.contentType _enum: ['visibility', 'distribution']
         * @property {Object} editedBy
         * @property {ObjectId} editedBy.user ___reference___ to {@link PersonnelModel}
         * @property {Date} editedBy.date Date of editing
         * @property {Object} createdBy
         * @property {ObjectId} createdBy.user ___reference___ to {@link PersonnelModel}
         * @property {Date} createdBy.date Date of creating
         * @property {Array} country Array of ObjectIds [___reference___] to {@link DomainModel}
         * @property {Array} region Array of ObjectIds [___reference___] to {@link DomainModel}
         * @property {Array} subRegion Array of ObjectIds [___reference___] to {@link DomainModel}
         * @property {Array} retailSegment Array of ObjectIds [___reference___] to {@link RetailSegmentModel}
         * @property {Array} outlet Array of ObjectIds [___reference___] to {@link OutletModel}
         * @property {Array} branch Array of ObjectIds [___reference___] to {@link BranchModel}
         * @property {String} location Contains location in format like: ___Country > Region, Another Region > SubRegion ...___, default: ''
         *
         */

        /**
         * @constructor InStoreTaskModel
         * @type {*|Schema}
         *
         * @property {Object} title _title_
         * @property {String} title.en
         * @property {String} title.ar
         * @property {Object} description _description_ of _Objective_
         * @property {String} description.en
         * @property {String} description.ar
         * @property {String} objectiveType _enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Individual']_
         * @property {String} priority _enum: ['Low', 'Medium', 'High', 'Urgent']_ default: 'Low'
         * @property {String} status _enum: ['draft', 'inProgress', 'overDue', 'toBeDiscussed', 'fail', 'completed', 'closed', 'reOpened']_ default: 'draft'
         * @property {Array} assignedTo Array of ObjectIds [___reference___] to {@link PersonnelModel}
         * @property {Number} complete _Progress from 0 to 100_
         * @property {Number} level The level of objective, depends on user accessRole
         * @property {Date} dateStart Date when objective starts
         * @property {Date} dateEnd Date when objective must be completed
         * @property {Date} dateClosed Date when objective exactly was closed
         * @property {Array} comments Array of ObjectIds [___reference___] to {@link CommentModel}
         * @property {Array} attachments Array of files ids attached to objective
         * @property {Object} form
         * @property {ObjectId} form._id ___reference___ to {@link DistributionFormModel} or {@link VisibilityFormModel}
         * @property {String} form.contentType _enum: ['visibility', 'distribution']
         * @property {Object} editedBy
         * @property {ObjectId} editedBy.user ___reference___ to {@link PersonnelModel}
         * @property {Date} editedBy.date Date of editing
         * @property {Object} createdBy
         * @property {ObjectId} createdBy.user ___reference___ to {@link PersonnelModel}
         * @property {Date} createdBy.date Date of creating
         * @property {Array} country Array of ObjectIds [___reference___] to {@link DomainModel}
         * @property {Array} region Array of ObjectIds [___reference___] to {@link DomainModel}
         * @property {Array} subRegion Array of ObjectIds [___reference___] to {@link DomainModel}
         * @property {Array} retailSegment Array of ObjectIds [___reference___] to {@link RetailSegmentModel}
         * @property {Array} outlet Array of ObjectIds [___reference___] to {@link OutletModel}
         * @property {Array} branch Array of ObjectIds [___reference___] to {@link BranchModel}
         * @property {Array} history Array of Objects
         * @property {ObjectId} history.assignedTo ObjectId [___reference___] to {@link PersonnelModel}
         * @property {Number} history.index Incremented field, 1 for first task, when assigned to another personnel equals to 2...
         * @property {String} location Contains location in format like: ___Country > Region, Another Region > SubRegion ...___, default: ''
         *
         */

        title: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        companyObjective: {
            en: {type: String, default: null},
            ar: {type: String, default: null}
        },
        //uses when creates SubTask and we choose to show companyObjective checkbox

        description: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        objectiveType: {type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'individual']},
        priority     : {type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'low'},
        context      : {
            type   : String,
            enum   : [CONTENT_TYPES.OBJECTIVES, CONTENT_TYPES.INSTORETASKS],
            default: CONTENT_TYPES.OBJECTIVES
        },

        history: [{
            _id       : false,
            assignedTo: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL},
            index     : Number

        }],

        status: {
            type   : String,
            enum   : [OBJECTIVE_STATUSES.DRAFT, OBJECTIVE_STATUSES.IN_PROGRESS, OBJECTIVE_STATUSES.OVER_DUE, OBJECTIVE_STATUSES.TO_BE_DISCUSSED, OBJECTIVE_STATUSES.FAIL, OBJECTIVE_STATUSES.COMPLETED, OBJECTIVE_STATUSES.CLOSED, OBJECTIVE_STATUSES.RE_OPENED, OBJECTIVE_STATUSES.ARCHIVED],
            default: OBJECTIVE_STATUSES.DRAFT
        },

        assignedTo: [{type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null}],
        efforts   : [{
            person: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            effort: {type: Number}
        }],

        complete: {type: Number, default: 0}, // number between 0-100
        parent  : {
            1: {type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null}, //Masted Admin
            2: {type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null}, //Country Admin
            3: {type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null}, //Area Manager
            4: {type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null}  //Area in charge Manager
        },

        level            : {type: Number},              //level of objective, depends of role
        countSubTasks    : {type: Number, default: 0},  //update when create subTask
        completedSubTasks: {type: Number, default: 0},  //increment this field

        dateStart : {type: Date},
        dateEnd   : {type: Date},
        dateClosed: {type: Date},

        comments   : [{type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null}],
        attachments: {type: Array, default: []},
        form       : {
            _id        : {type: ObjectId},
            contentType: {type: String, enum: ['visibility', 'distribution']}
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },

        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },

        country      : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null}],
        region       : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null}],
        subRegion    : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null}],
        retailSegment: [{type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, default: null}],
        outlet       : [{type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null}],
        branch       : [{type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null}],
        location     : {type: String, default: ''},

        archived: {type: Boolean, default: false}

    }, {collection: 'objectives'});

    mongoose.model(CONTENT_TYPES.OBJECTIVES, objectiveSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.OBJECTIVES] = objectiveSchema;
})();