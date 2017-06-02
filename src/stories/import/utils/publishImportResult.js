const PubNubClient = require('../../../stories/push-notifications/utils/pubnub');
const logger = require('./../../../utils/logger');

function truncateImportErrors(data) {
    if (data && data.result && data.result.length) {
        for (const item of data.result) {
            if (item.errors && item.errors.length) {
                item.errors = item.errors.slice(0, 100);
            }
        }
    }

    return data;
}

module.exports = function (channel, data) {
    let message = truncateImportErrors(data);

    PubNubClient.publish({
        channel,
        message,
    }, (err) => {
        if (err) {
            logger.warn(`Error to publish import result. Details: ${err}`);
        }
    });
};
