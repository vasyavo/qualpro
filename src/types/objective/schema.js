const Schema = require('mongoose').Schema;
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const OTHER_CONSTANTS = require('../../public/js/constants/otherConstants');

const ObjectId = Schema.Types.ObjectId;
const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

const schema = new Schema({
    title: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' },
    },
    companyObjective: {
        en: { type: String, default: null },
        ar: { type: String, default: null },
    },
    description: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' },
    },
    objectiveType: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'individual', 'country'] },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'low' },
    context: {
        type: String,
        enum: [CONTENT_TYPES.OBJECTIVES, CONTENT_TYPES.INSTORETASKS],
        default: CONTENT_TYPES.OBJECTIVES,
    },
    history: [{
        _id: false,
        assignedTo: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL },
        index: Number,

    }],
    status: {
        type: String,
        enum: [
            OBJECTIVE_STATUSES.DRAFT,
            OBJECTIVE_STATUSES.IN_PROGRESS,
            OBJECTIVE_STATUSES.OVER_DUE,
            OBJECTIVE_STATUSES.TO_BE_DISCUSSED,
            OBJECTIVE_STATUSES.FAIL,
            OBJECTIVE_STATUSES.COMPLETED,
            OBJECTIVE_STATUSES.CLOSED,
            OBJECTIVE_STATUSES.RE_OPENED,
            OBJECTIVE_STATUSES.ARCHIVED,
        ],
        default: OBJECTIVE_STATUSES.DRAFT,
    },
    assignedTo: [{ type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null }],
    efforts: [{
        person: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        effort: { type: Number },
    }],
    complete: { type: Number, default: 0 }, // number between 0-100
    parent: {
        1: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null }, // Masted Admin
        2: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null }, // Country Admin
        3: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null }, // Area Manager
        4: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null },  // Area in charge Manager
    },
    level: { type: Number },              // level of objective, depends of role
    countSubTasks: { type: Number, default: 0 },  // update when create subTask
    completedSubTasks: { type: Number, default: 0 },  // increment this field
    dateStart: { type: Date },
    dateEnd: { type: Date },
    dateClosed: { type: Date },
    comments: [{ type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null }],
    attachments: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.FILES,
        }],
        default: [],
    },
    form: {
        type: {
            _id: { type: ObjectId },
            contentType: { type: String, enum: ['visibility', 'distribution'] }
        },
        default: null,
    },
    createdBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    editedBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    country: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    region: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    subRegion: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.DOMAIN,
        }],
        default: [],
    },
    retailSegment: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.RETAILSEGMENT,
        }],
        default: [],
    },
    outlet: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.OUTLET,
        }],
        default: [],
    },
    branch: {
        type: [{
            type: ObjectId,
            ref: CONTENT_TYPES.BRANCH,
        }],
        default: [],
    },
    location: {
        type: String,
        default: '',
    },
    archived: {
        type: Boolean,
        default: false,
    },
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.OBJECTIVES}`,
    versionKey: false,
});

module.exports = schema;
