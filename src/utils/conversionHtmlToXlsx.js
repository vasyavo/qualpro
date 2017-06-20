const conversion = require('html-to-xlsx')({
    /* number of allocated phantomjs processes */
    numberOfWorkers: 3,
    /* timeout in ms for html conversion, when the timeout is reached, the phantom process is recycled */
    timeout: 20000,
    /* directory where are stored temporary html and pdf files, use something like npm package reaper to clean this up */
    tmpDir: 'os/tmpdir',
    /* optional port range where to start phantomjs server */
    portLeftBoundary: 3000,
    portRightBoundary: 4000,
    /* optional hostname where to start phantomjs server */
    host: '127.0.0.1',
});

module.exports = conversion;
