const levee = require('levee');
const request = require('request');
const config = require('../config');

const circuit = levee.createBreaker(request, {
    maxFailures : 5,
    timeout : 60000,
    resetTimeout : 30000
});

const circuitRequest = (requestOptions, callback) => {
    circuit.run(requestOptions, (err, response, body) => {
        if (err) {
            return callback(err);
        }

        if (response.statusCode > 100 && response.statusCode < 400) {
            callback(null, body);
        }

        callback(body);
    });
};

const post = (opts, callback) => {
    const requestOptions = Object.assign({
        method: 'POST',
        url : `${config.schedulerHost}/tasks`
    }, opts);

    circuitRequest(requestOptions, callback);
};

module.exports = {
    post,
    circuitRequest,
};
