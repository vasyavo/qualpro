const Joi = require('joi');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

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

const beforeItem = Joi.object().keys({
    file : Joi.string().allow(''),
    branch : Joi.objectId().allow(null)
});
const create = Joi.object().keys({
    createdBy : {
        user : Joi.objectId().required(),
        date : Joi.date().default(currentDate, 'current date')
    },
    updatedBy : {
        user : Joi.objectId().default(Joi.ref('createdBy.user')),
        date : Joi.date().default(currentDate, 'current date')
    },
    objective : Joi.objectId().required(),
    before : Joi.object().keys({
        files : Joi.array().items(beforeItem).min(1)
    })
});
const update = Joi.object().keys({
    updatedBy : {
        user : Joi.objectId().default(Joi.ref('createdBy.user')),
        date : Joi.date().default(currentDate, 'current date')
    },
    objective : Joi.objectId().required(),
    before : Joi.object().keys({
        files : Joi.array().items(beforeItem).min(1)
    }),
    after : Joi.object().keys({
        files : Joi.array().items(beforeItem).min(1)
    })
});


module.exports = {
    create,
    update
};
