'use strict';
const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = Schema({
    personnel: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, min: 1970, required: true },
    time: {
        type: String,
        enum: ['spring', 'fall'],
        required: true
    },
    dataKey: { type: String },
    type: { type: String, default: CONTENT_TYPES.BIYEARLY },
    planningAndOrganizationSkills: {
        prepareObj: { type: Number, min: 0, max: 5, required: true },
        preparePlan: { type: Number, min: 0, max: 5, required: true },
        followPlan: { type: Number, min: 0, max: 5, required: true },
        result: { type: Number, required: true }
    },
    reporting: {
        marketFeed: { type: Number, min: 0, max: 5, required: true },
        marketDev: { type: Number, min: 0, max: 5, required: true },
        businessOpp: { type: Number, min: 0, max: 5, required: true },
        competAct: { type: Number, min: 0, max: 5, required: true },
        negSkill: { type: Number, min: 0, max: 5, required: true },
        objections: { type: Number, min: 0, max: 5, required: true },
        result: { type: Number, required: true }
    },
    sellingSkills: {
        stockCheck: { type: Number, min: 0, max: 5, required: true },
        orderCalc: { type: Number, min: 0, max: 5, required: true },
        sellFeatures: { type: Number, min: 0, max: 5, required: true },
        identifySign: { type: Number, min: 0, max: 5, required: true },
        closingTech: { type: Number, min: 0, max: 5, required: true },
        sellingAids: { type: Number, min: 0, max: 5, required: true },
        rotationAndCheck: { type: Number, min: 0, max: 5, required: true },
        distribution: { type: Number, min: 0, max: 5, required: true },
        followIssues: { type: Number, min: 0, max: 5, required: true },
        result: { type: Number, required: true }
    },
    personalSkills: {
        marketFeed: { type: Number, min: 0, max: 5, required: true },
        marketDev: { type: Number, min: 0, max: 5, required: true },
        businessOpp: { type: Number, min: 0, max: 5, required: true },
        persMot: { type: Number, min: 0, max: 5, required: true },
        investOr: { type: Number, min: 0, max: 5, required: true },
        listStyle: { type: Number, min: 0, max: 5, required: true },
        selfTimeMan: { type: Number, min: 0, max: 5, required: true },
        energyLev: { type: Number, min: 0, max: 5, required: true },
        detailsAtt: { type: Number, min: 0, max: 5, required: true },
        problemSol: { type: Number, min: 0, max: 5, required: true },
        //=======
        customerAw: { type: Number, min: 0, max: 5, required: true },
        teamWork: { type: Number, min: 0, max: 5, required: true },
        cooperation: { type: Number, min: 0, max: 5, required: true },
        communication: { type: Number, min: 0, max: 5, required: true },
        computerSkills: { type: Number, min: 0, max: 5, required: true },
        initiative: { type: Number, min: 0, max: 5, required: true },
        appearance: { type: Number, min: 0, max: 5, required: true },
        attitude: { type: Number, min: 0, max: 5, required: true },
        attendance: { type: Number, min: 0, max: 5, required: true },
        commitment: { type: Number, min: 0, max: 5, required: true },
        result: { type: Number, required: true }
    },
    overallPerformance: { type: Number, min: 0, max: 5, required: true }, //Standard Superior
    performanceSummary: { type: String, default: '' },
    action: { type: String, default: '' },
    objectives: { type: String, default: '' },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, required: true },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL },
        date: { type: Date, default: new Date() }
    }
}, { collection: 'biYearlies' });

schema.pre('validate', function(next) {
    this.month = (this.time === 'spring') ? 6 : 12;
    this.dataKey = this.year * 100 + this.month;
    next();
});

module.exports = schema;
