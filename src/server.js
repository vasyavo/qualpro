const throng = require('throng');
const WORKERS = process.env.WEB_CONCURRENCY || 1;

function start() {
    require('./app');
}

throng(start, {
    workers: WORKERS,
    lifetime: Infinity
});
