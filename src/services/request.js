const levee = require('levee');
const request = require('request');

const circuit = levee.createBreaker(request, {
    maxFailures : 5,
    timeout : 60000,
    resetTimeout : 30000
});

const post = (opts, cb) => {
    const requestOptions = Object.assign({
        method: 'POST'
    }, opts);

    circuit.run(requestOptions, (err, response, body) => {
        if (err) {
            return cb(err);
        }

        if (response.statusCode > 100 && response.statusCode < 400) {
            cb(null, body);
        }

        cb(body);
    });
};

module.exports = {
    post
};
