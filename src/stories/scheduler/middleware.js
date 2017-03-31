const middleware = require('abstract-scheduler').middleware;
const logger = require('./../../utils/logger');
const config = require('./../../config');
const SchedulerCollection = require('./collection');
const actions = require('./actions');

module.exports = middleware({
    logger,
    url: config.schedulerHost,
    actions,
    collection: SchedulerCollection,
});
