const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.OBJECTIVE;
        const contentType = contentTypes.OBJECTIVES;
        const actionType = activityTypes.UPDATED;
        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            actionOriginator,
            payload,
            setHighPriority,
            setOriginator,
            setAssignee,
            setSupervisor,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setHighPriority,
            subject: {
                en: 'Objective updated',
                ar: '',
            },
            payload,
        }, {
            recipients: setOriginator,
            subject: {
                en: 'Sub-objective updated',
                ar: '',
            },
            payload,
        }, {
            recipients: setAssignee,
            subject: {
                en: 'Received updated objective',
                ar: '',
            },
            payload,
        }, {
            recipients: setSupervisor,
            subject: {
                en: `Subordinate's objective updated`,
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
