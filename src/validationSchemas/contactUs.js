var Joi = require('joi')
var moment = require('moment')

Joi.objectId = require('joi-objectid')(Joi);

function currentDate() {
    return moment().utc().format('YYYY-MM-DD HH:mm:ss')
}
var create = Joi.object().keys({
    createdBy : Joi.objectId().required(),
    module : Joi.string().valid([
        'No modules',
        'Activity list',
        'Locations',
        'Personnel',
        'Items and Prices',
        'Objectives',
        'In-srote reporting',
        'Reporting',
        'Al Alali Marketing',
        'Planograms',
        'Competitors list',
        'Contracts',
        'Documents',
        'Notes'
    ]).required(),
    status : Joi.string().default('new'),
    type : Joi.string().valid([
        'bug',
        'comment',
        'idea'
    ]).required(),
    description : Joi.string().required(),
    createdAt : Joi.date().default(currentDate, 'current date')
});

module.exports = {
    create : create
};
