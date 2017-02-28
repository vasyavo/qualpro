const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.CONTACT_US;
        const contentType = contentTypes.CONTACT_US;
        const actionType = activityTypes.CREATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            actionOriginator,
            payload,
            highPriority,
            setAdmin,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: highPriority,
            subject: {
                en: 'Contact Us published',
                ar: '',
            },
            payload,
        }, {
            recipients: setAdmin,
            subject: {
                en: 'Contact Us received',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups, {
            actionOriginator,
            moduleId,
        });
    });
};
