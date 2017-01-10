const mongo = require('./utils/mongo');
const eventEmitter = require('./utils/eventEmitter');

const Scheduler = require('./helpers/scheduler')(mongo, eventEmitter);
const scheduler = new Scheduler();
scheduler.initEveryHourScheduler();
