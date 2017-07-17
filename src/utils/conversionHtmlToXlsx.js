const config = require('../config/');
const conversion = require('html-to-xlsx')({
    /* number of allocated phantomjs processes */
    numberOfWorkers: config.phantom.numberOfWorkers,
    /* timeout in ms for html conversion, when the timeout is reached, the phantom process is recycled */
    timeout: config.phantom.timeout,
    /* directory where are stored temporary html and pdf files, use something like npm package reaper to clean this up */
    tmpDir: 'os/tmpdir',
    /* optional port range where to start phantomjs server */
    portLeftBoundary: config.phantom.portLeftBoundary,
    portRightBoundary: config.phantom.portRightBoundary,
    /* optional hostname where to start phantomjs server */
    host: config.phantom.host,
});

module.exports = conversion;
