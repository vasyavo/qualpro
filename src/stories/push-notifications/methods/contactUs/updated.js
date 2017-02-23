const co = require('co');
const _ = require('lodash');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.CONTACT_US;
        const contentType = contentTypes.CONTACT_US;
        const actionType = activityTypes.UPDATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            highPriority,
            setAdmin,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: _.uniq([
                ...highPriority,
                ...setAdmin,
            ]),
            subject: {
                en: 'Contact Us updated',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups, { moduleId });
    });
};
