const throng = require('throng');
const config = require('./config');

function startWorker(id) {
    console.log(`Started worker ${ id }`);

    process.on('SIGTERM', () => {
        console.log(`Worker ${ id } exiting...`);
        console.log('(cleanup would happen here)');
        process.exit();
    });

    require('./app');
}

function startMaster() {
    require('./master');
}

throng({
    workers: config.webConcurrency,
    lifetime: Infinity,
    master: startMaster,
    start: startWorker,
    grace: 4000
});
