const async = require('async');
const Bluebird = require('bluebird');
const PubNubClient = require('./pubnub');
const addAction = require('./../utils/addAction');

class MessageDispatcher {

    /*
     * @param {Object[]} groups
     * @param {String[]} groups.recipient set of user ID
     * @param {Object} groups.subject
     * @param {String} groups.subject.en
     * @param {String} groups.subject.ar
     * @param {Object} groups.payload
     * */
    static sendMessage(groups, callback) {
        /*
         * @param {Object} action
         * @param {Object} action.payload
         * */
        const itRecipient = (action) => {
            return (recipient, itCallback) => {
                async.waterfall([

                    async.apply(addAction, recipient),

                    (numberOfNewActivities, cb) => {
                        const payload = Object.assign({}, action.payload, {
                            badge: numberOfNewActivities,
                        });

                        PubNubClient.publish({
                            message: payload,
                            channel: recipient,
                        }, cb);
                    }

                ], itCallback);
            }
        };

        const itGroup = (group, itCallback) => {
            const {
                recipients,
                payload,
            } = group;
            const action = {
                payload
            };

            async.each(recipients, itRecipient(action), itCallback);
        };

        async.each(groups, itGroup, callback);
    }

}

MessageDispatcher.sendMessage = Bluebird.promisify(MessageDispatcher.sendMessage);

module.exports = MessageDispatcher;
