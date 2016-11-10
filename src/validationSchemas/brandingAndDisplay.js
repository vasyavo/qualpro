const Joi = require('joi');
const moment = require('moment');

Joi.objectId = require('joi-objectid')(Joi);

function currentDate() {
    return moment().utc().format('YYYY-MM-DD HH:mm:ss');
}

const create = Joi.object().keys({
    createdBy : Joi.objectId().required(),
    branch : Joi.objectId().required(),
    displayType : Joi.number().integer().required(),
    outlet : Joi.objectId().required(),
    categories : Joi.array().items(Joi.objectId()),
    description : Joi.string().required(),
    dateStart : Joi.date().max(Joi.ref('dateEnd')).default(currentDate, 'current date'),
    dateEnd : Joi.date().min(Joi.ref('dateStart')).default(currentDate, 'current date'),
    createdAt : Joi.date().default(currentDate, 'current date'),
    updatedAt : Joi.date().default(currentDate, 'current date')
});

module.exports = {
    create
};
