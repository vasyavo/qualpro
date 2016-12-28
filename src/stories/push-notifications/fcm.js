const http = require('http');
const querystring = require('querystring');

class FirebaseCloudMessagingClient {

    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    send(payload, callback) {
        const postData = querystring.stringify(payload);

        const options = {
            hostname: 'fcm.googleapis.com',
            port: 443,
            path: '/fcm/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `key=${this.apiKey}`,
                'Connection': 'keep-alive'
            }
        };

        const req = http.request(options, (res) => {
            const statusCode = res.statusCode;
            const rawDowstreamChunks = [];

            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                rawDowstreamChunks.push(chunk);
            });
            res.on('end', () => {
                const rawData = rawDowstreamChunks.join();

                if (statusCode === 200 && rawData.indexOf('multicast_id')) {
                    const responseBody = JSON.parse(rawData);

                    callback(null, responseBody);
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

}

module.exports = FirebaseCloudMessagingClient;
