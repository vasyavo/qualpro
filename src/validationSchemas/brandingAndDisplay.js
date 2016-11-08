const Joi = require('joi');
const moment = require('moment');

Joi.objectId = require('joi-objectid')(Joi);

function currentDate() {
    return moment().utc().format('YYYY-MM-DD HH:mm:ss');
}

const create = Joi.object().keys({
    createdBy : Joi.objectId().required(),
    branch : Joi.array().items(Joi.objectId()).required(),
    displayType : Joi.objectId().required(),
    outlet : Joi.array().items(Joi.objectId()).required(),
    category : Joi.array(Joi.objectId()).items(Joi.objectId()),
    description : Joi.string().required(),
    dateStart : Joi.date().max(Joi.ref('dateEnd')).required(),
    dateEnd : Joi.date().min(Joi.ref('dateStart')).required(),
    createdAt : Joi.date().default(currentDate, 'current date'),
    updatedAt : Joi.date().default(currentDate, 'current date')
});

module.exports = {
    create : create
};
