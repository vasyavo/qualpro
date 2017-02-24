const throng = require('throng');
const config = require('./config');

/* eslint-disable global-require */

if (config.debug) {
    require('./app');
    require('./master');

    return;
}

function startWorker(id) {
    console.log(`Started worker ${id}`);

    process.on('SIGTERM', () => {
        console.log(`Worker ${id} exiting...`);
        console.log('(cleanup would happen here)');
        process.exit();
    });

    require('./app');
}

function startMaster() {
    require('./master');
}

/* eslint-enable global-require */

throng({
    workers: config.webConcurrency,
    lifetime: Infinity,
    master: startMaster,
    start: startWorker,
    grace: 4000,
});