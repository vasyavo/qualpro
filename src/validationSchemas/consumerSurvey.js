const Joi = require('joi');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const CONSTANTS = require('../constants/mainConstants');
const TYPES = [
    'Application Related Issue',
    'Future Application Ideas',
    'Others'
];
const STATUSES = [
    'draft',
    'active'
];

Joi.objectId = require('joi-objectid')(Joi);

const customJoi = Joi.extend({
    base : Joi.objectId(),
    name : 'objectId',
    language : {
        toObjectId : 'can\'t convert to objectId, wrong format'
    },
    rules : [
        {
            name : 'toObjectId',
            validate(params, value, state, options) {
                return new ObjectId(value);
            }
        }
    ]
});
function currentDate() {
    return moment().utc().format('YYYY-MM-DD HH:mm:ss');
}
function startOfYear() {
    return moment().utc().startOf('year').format('YYYY-MM-DD HH:mm:ss');
}

const create = Joi.object().keys({
    createdBy : Joi.objectId().required(),
    status : Joi.string().valid(STATUSES).default('draft'),
    type : Joi.string().valid(TYPES).required(),
    title : Joi.string().required(),
    createdAt : Joi.date().default(currentDate, 'current date'),
    updatedAt : Joi.date().default(currentDate, 'current date'),
    dueDate : Joi.date().min(currentDate)
});

module.exports = {
    create : create
};
