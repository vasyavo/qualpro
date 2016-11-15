const Joi = require('joi');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

Joi.objectId = require('joi-objectid')(Joi);

const CONSTANTS = require('../constants/mainConstants');
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
    branch : Joi.objectId().required(),
    displayType : Joi.number().integer().required(),
    outlet : Joi.objectId().required(),
    categories : Joi.array().items(Joi.objectId()),
    description : Joi.object().keys({
        en : Joi.string(),
        ar : Joi.string()
    }).required(),
    dateStart : Joi.date().max(Joi.ref('dateEnd')).default(currentDate, 'current date'),
    dateEnd : Joi.date().min(Joi.ref('dateStart')).default(currentDate, 'current date'),
    createdAt : Joi.date().default(currentDate, 'current date'),
    updatedAt : Joi.date().default(currentDate, 'current date')
});
const objectIdsCollection = Joi.object().keys({
    values : Joi.array().items(customJoi.objectId().toObjectId())
});
const getAll = Joi.object().keys({
    page : Joi.number().integer().min(1).default(1),
    count : Joi.number().integer().default(CONSTANTS.LIST_COUNT),
    sortBy : Joi.string().default('createdAt'),
    filter : Joi.object().keys({
        createdBy : objectIdsCollection,
        categories : objectIdsCollection,
        outlet : objectIdsCollection,
        branch : objectIdsCollection,
        country : Joi.object().keys({
            values : Joi.array().items(customJoi.objectId().toObjectId()).max(1)
        }),
        region : objectIdsCollection,
        subRegion : objectIdsCollection,
        position : objectIdsCollection,
        startDate : Joi.date().default(startOfYear, 'start of a year date'),
        endDate : Joi.date().default(currentDate, 'current date')
    }).rename('personnel', 'createdBy').default({
        startDate : startOfYear(),
        endDate : currentDate()
    })
});

module.exports = {
    create,
    getAll
};
