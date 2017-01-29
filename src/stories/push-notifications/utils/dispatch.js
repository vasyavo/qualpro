const sendPush = require('./../utils/sendPush');
const MessageDispatcher = require('./../utils/messageDispatcher');

module.exports = function * (groups) {
    yield MessageDispatcher.sendMessage(groups);
    yield sendPush(groups);
};
