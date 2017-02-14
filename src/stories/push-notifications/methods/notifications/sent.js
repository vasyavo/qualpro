const co = require('co');
const _ = require('lodash');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./../marketing/al-alali-questionnaire/prototypeUpdated');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.NOTIFICATION;
        const contentType = contentTypes.NOTIFICATIONS;
        const actionType = activityTypes.CREATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            actionOriginator,
            setEveryoneInLocation,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: [actionOriginator],
            subject: {
                en: 'Notification sent',
                ar: '',
            },
            payload,
        }, {
            recipients: _.difference(setEveryoneInLocation, [actionOriginator]),
            subject: {
                en: 'Notification received',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
