const middleware = require('abstract-scheduler');
const logger = require('./../../utils/logger');
const config = require('./../../config');
const SchedulerModel = require('./model');
const actions = require('./actions');

module.exports = middleware({
    logger,
    host: config.schedulerHost,
    actions,
    scheduler: SchedulerModel,
});
