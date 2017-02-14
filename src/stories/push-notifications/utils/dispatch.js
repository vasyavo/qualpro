const _ = require('lodash');
const sendPush = require('./../utils/sendPush');
const MessageDispatcher = require('./../utils/messageDispatcher');

module.exports = function * (groups) {
    const groupsWithUniqueRecipients = groups.map(group => {
        return Object.assign({}, group, {
            recipients: _.uniq(group.recipients)
                .filter(recipient => recipient),
        });
    });

    yield MessageDispatcher.sendMessage(groupsWithUniqueRecipients);
    yield sendPush(groupsWithUniqueRecipients);
};
