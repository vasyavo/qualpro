const mongoose = require('mongoose');
const async = require('async');

mongoose.Schemas = {}; // important thing
require('./types');

const mongo = require('./utils/mongo');
const eventEmitter = require('./utils/eventEmitter');

const Scheduler = require('./helpers/scheduler')(mongo, eventEmitter);
const scheduler = new Scheduler();
scheduler.initEveryHourScheduler();

mongo.on('connected', () => {
    async.series([

        (cb) => {
            require('./modulesCreators')(cb)
        },

    ])
});
