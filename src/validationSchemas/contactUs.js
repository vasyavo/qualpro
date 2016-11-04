var Joi = require('joi');
var moment = require('moment');

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
    type : Joi.string().valid(TYPES),
    status : Joi.string().valid(STATUSES),
    sortBy : Joi.string().default('createdAt'),
    startDate : Joi.date().default(startOfYear, 'start of a year date'),
    endDate : Joi.date().default(currentDate, 'current date')
});

module.exports = {
    create : create,
    getAll : getAll,
    update : update
};
