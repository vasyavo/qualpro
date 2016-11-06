var Joi = require('joi');
var moment = require('moment');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var CONSTANTS = require('../constants/mainConstants');
var TYPES = [
    'Application Related Issue',
    'Future Application Ideas',
    'Others'
];
var STATUSES = [
    'new',
    'resolved'
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

var create = Joi.object().keys({
    createdBy : Joi.objectId().required(),
    status : Joi.string().default('new'),
    type : Joi.string().valid(TYPES).required(),
    description : Joi.string().required(),
    createdAt : Joi.date().default(currentDate, 'current date')
});

var update = Joi.object().keys({
    status : Joi.string().valid('resolved'),
    comment : Joi.string()
});

var getAll = Joi.object().keys({
    page : Joi.number().integer().min(1).default(1),
    count : Joi.number().integer().default(CONSTANTS.LIST_COUNT),
    sortBy : Joi.string().default('createdAt'),
    type : Joi.array().items(Joi.string().valid(TYPES)),
    status : Joi.array().items(Joi.string().valid(STATUSES)),
    createdBy : Joi.array().items(customJoi.objectId().toObjectId()),
    'creator.position' : Joi.array().items(customJoi.objectId().toObjectId()),
    startDate : Joi.date().default(startOfYear, 'start of a year date'),
    endDate : Joi.date().default(currentDate, 'current date')
});

module.exports = {
    create : create,
    getAll : getAll,
    update : update
};
