const _ = require('lodash');
const sendPush = require('./../utils/sendPush');
const MessageDispatcher = require('./../utils/messageDispatcher');

module.exports = function * (groups, options) {
    const groupsWithUniqueRecipients = groups.map(group => {
        return Object.assign({}, group, {
            recipients: _.uniq(group.recipients)
                .filter(recipient => recipient),
        });
    });

    MessageDispatcher.sendMessage(groupsWithUniqueRecipients, options);

    yield sendPush(groupsWithUniqueRecipients);
};
