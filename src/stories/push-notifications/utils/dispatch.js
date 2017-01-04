const sendActionViaPushNotification = require('./../utils/sendPush');
const MessageDispatcher = require('./../utils/messageDispatcher');

module.exports  = function * (action) {
    yield MessageDispatcher.sendMessage(action);
    yield sendActionViaPushNotification(action);
};