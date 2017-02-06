const Joi = require('joi');
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const CONSTANTS = require('../constants/mainConstants');
Joi.objectId = require('joi-objectid')(Joi);

const create = Joi.object().keys({
    title     : Joi.string().allow(''),
    parent    : Joi.objectId().default(null),
    attachment: Joi.objectId().default(null),
    search    : Joi.string().default(null),
    type      : Joi.string().valid(['file', 'folder']).required(),
});

const update = Joi.object().keys({
    title: Joi.string().allow('')
});

const getAll = Joi.object().keys({
    page     : Joi.number().integer().min(1).default(1),
    count    : Joi.number().integer().default(CONSTANTS.LIST_COUNT),
    sortBy   : Joi.string().default('createdAt'),
    sortOrder: Joi.number().valid([-1, 1]).default(-1),
});

const sync = Joi.object().keys({
    lastLogOut: Joi.date().required()
});

module.exports = {
    sync  : sync,
    create: create,
    getAll: getAll,
    update: update
};
