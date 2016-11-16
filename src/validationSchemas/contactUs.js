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
const customMongoJoi = Joi.extend({
    base : Joi.string(),
    name : 'mongoQuering',
    language : {
        commentsMongoPush : 'can\'t convert to mongo query'
    },
    rules : [
        {
            name : 'commentsMongoPush',
            validate(params, value, state, options) {
                return {
                    comments : value
                };
            }
        }
    ]
});

function currentDate() {
    return moment().utc().toISOString(); //.format('YYYY-MM-DD HH:mm:ss');
}
function startOfYear() {
    return moment().utc().startOf('year').toISOString(); //.format('YYYY-MM-DD HH:mm:ss');
}

const create = Joi.object().keys({
    createdBy : Joi.objectId().required(),
    status : Joi.string().default('new'),
    type : Joi.string().valid(TYPES).required(),
    description : Joi.string().required(),
    createdAt : Joi.date().default(currentDate, 'current date')
});

const update = Joi.object().keys({
    status : Joi.string().valid('resolved'),
    $push : customMongoJoi.mongoQuering().commentsMongoPush()
}).rename('comment', '$push');

const getAll = Joi.object().keys({
    page : Joi.number().integer().min(1).default(1),
    count : Joi.number().integer().default(CONSTANTS.LIST_COUNT),
    sortBy : Joi.string().default('createdAt'),
    filter : Joi.object().keys({
        type : Joi.object().keys({
            values : Joi.array().items(Joi.string().valid(TYPES))
        }),
        status : Joi.object().keys({
            values : Joi.array().items(Joi.string().valid(STATUSES))
        }),
        createdBy : Joi.object().keys({
            values : Joi.array().items(customJoi.objectId().toObjectId())
        }),
        country : Joi.object().keys({
            values : Joi.array().items(customJoi.objectId().toObjectId()).max(1)
        }),
        position : Joi.object().keys({
            values : Joi.array().items(customJoi.objectId().toObjectId())
        }),
        startDate : Joi.date().default(startOfYear, 'start of a year date'),
        endDate : Joi.date().default(currentDate, 'current date')
    }).rename('personnel', 'createdBy').default({
        startDate : startOfYear(),
        endDate : currentDate()
    })
});

module.exports = {
    create : create,
    getAll : getAll,
    update : update
};
