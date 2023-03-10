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
        const actionType = activityTypes.OVERDUE;
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
                en: 'Objective overdue',
                ar: '',
            },
            payload,
        }, {
            recipients: setOriginator,
            subject: {
                en: 'Sub-objective overdue',
                ar: '',
            },
            payload,
        }, {
            recipients: setAssignee,
            subject: {
                en: 'Objective overdue',
                ar: '',
            },
            payload,
        }, {
            recipients: setSupervisor,
            subject: {
                en: 'Subordinate\'s objective overdue',
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
