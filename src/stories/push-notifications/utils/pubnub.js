const PubNub = require('pubnub');
const config = require('./../../../config');
const logger = require('./../../../utils/logger');

class PubNubClient {

    constructor() {
        this.client = null;
    }

    static init() {
        this.client = new PubNub({
            publishKey: config.pubnub.publishKey,
            subscribeKey: config.pubnub.subscribeKey,
            ssl: true,
        });
    }

    static publish(options, callback) {
        const {
            message,
            channel,
        } = options;
        const payload = {
            message,
            channel,
            sendByPost: true,
            storeInHistory: false,
        };

        this.client.publish(payload, (status, response) => {
            if (status.error) {
                logger.error(status);

                callback(status);
            } else {
                logger.info('Message published', payload, response);
                callback(null, response);
            }
        });
    }

}

module.exports = PubNubClient;
