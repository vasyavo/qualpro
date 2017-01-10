const cluster = require('cluster');
const os = require('os');
const config = require('./config');

if (cluster.isMaster) {
    for (let i = 0; i < config.numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', (deadWorker, code, signal) => {
        const worker = cluster.fork();

        const newPID = worker.process.pid;
        const oldPID = deadWorker.process.pid;

        console.log(`Worker ${oldPID} died.`);
        console.log(`Worker ${newPID} born.`);
    });
} else {
    require('./app');
}
