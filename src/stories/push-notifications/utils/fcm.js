const https = require('https');
const retry = require('retry');

const sendToApi = (postData, options, callback) => {
    const req = https.request(options, (res) => {
        const statusCode = res.statusCode;
        const rawDownstreamChunks = [];

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            rawDownstreamChunks.push(chunk);
        });
        res.on('end', () => {
            const rawData = rawDownstreamChunks.join();

            if (statusCode === 200 && rawData.indexOf('multicast_id')) {
                const responseBody = JSON.parse(rawData);

                return callback(null, responseBody);
            }

            // Implement exponential back-off in your retry mechanism
            const retryReasons = [
                'DeviceMessageRateExceeded',
                'TopicsMessageRateExceeded',
            ];
            const rateExceededRetry = retryReasons.indexOf(rawData);

            const possibleErrors = [
                'Unavailable',
                'InternalServerError',
            ];
            const retryAfter = res.headers['Retry-After'];
            const internalServerRetry = possibleErrors.indexOf(rawData) && !isNaN(retryAfter);

            if (rateExceededRetry || internalServerRetry) {
                // todo delegate to scheduler service
            }

            const error = new Error(rawData);

            callback(error);
        });
    });

    req.on('error', (error) => {
        callback(error);
    });

    req.write(postData);
    req.end();
};

class FirebaseCloudMessagingClient {

    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    send(payload, callback) {
        const postData = JSON.stringify(payload);

        const options = {
            hostname: 'fcm.googleapis.com',
            port: '443',
            path: '/fcm/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                Authorization: `key=${this.apiKey}`,
                Connection: 'keep-alive',
            },
        };

        const operation = retry.operation({
            retries: 10,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 4000,
            randomize: true,
            forever: false,
            unref: false,
        });

        operation.attempt((currentAttempt) => {
            sendToApi(postData, options, (err, responseBody) => {
                if (operation.retry(err)) {
                    return;
                }

                callback(err ? operation.mainError() : null, responseBody);
            });
        });
    }

}

module.exports = FirebaseCloudMessagingClient;
