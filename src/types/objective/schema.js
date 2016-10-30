const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');
const OTHER_CONSTANTS = require('../../public/js/constants/otherConstants.js');
const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

const schema = new Schema({
    title: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    companyObjective: {
        en: { type: String, default: null },
        ar: { type: String, default: null }
    },
    //uses when creates SubTask and we choose to show companyObjective checkbox
    description: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    objectiveType: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'individual'] },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'low' },
    context: {
        type: String,
        enum: [CONTENT_TYPES.OBJECTIVES, CONTENT_TYPES.INSTORETASKS],
        default: CONTENT_TYPES.OBJECTIVES
    },
    history: [{
        _id: false,
        assignedTo: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL },
        index: Number

    }],
    status: {
        type: String,
        enum: [OBJECTIVE_STATUSES.DRAFT, OBJECTIVE_STATUSES.IN_PROGRESS, OBJECTIVE_STATUSES.OVER_DUE, OBJECTIVE_STATUSES.TO_BE_DISCUSSED, OBJECTIVE_STATUSES.FAIL, OBJECTIVE_STATUSES.COMPLETED, OBJECTIVE_STATUSES.CLOSED, OBJECTIVE_STATUSES.RE_OPENED, OBJECTIVE_STATUSES.ARCHIVED],
        default: OBJECTIVE_STATUSES.DRAFT
    },
    assignedTo: [{ type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null }],
    efforts: [{
        person: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        effort: { type: Number }
    }],
    complete: { type: Number, default: 0 }, // number between 0-100
    parent: {
        1: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null }, //Masted Admin
        2: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null }, //Country Admin
        3: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null }, //Area Manager
        4: { type: ObjectId, ref: CONTENT_TYPES.OBJECTIVES, default: null }  //Area in charge Manager
    },
    level: { type: Number },              //level of objective, depends of role
    countSubTasks: { type: Number, default: 0 },  //update when create subTask
    completedSubTasks: { type: Number, default: 0 },  //increment this field
    dateStart: { type: Date },
    dateEnd: { type: Date },
    dateClosed: { type: Date },
    comments: [{ type: ObjectId, ref: CONTENT_TYPES.COMMENT, default: null }],
    attachments: { type: Array, default: [] },
    form: {
        _id: { type: ObjectId },
        contentType: { type: String, enum: ['visibility', 'distribution'] }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    country: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null }],
    region: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null }],
    subRegion: [{ type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null }],
    retailSegment: [{ type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, default: null }],
    outlet: [{ type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null }],
    branch: [{ type: ObjectId, ref: CONTENT_TYPES.BRANCH, default: null }],
    location: { type: String, default: '' },
    archived: { type: Boolean, default: false }
}, { collection: 'objectives' });

module.exports = schema;
