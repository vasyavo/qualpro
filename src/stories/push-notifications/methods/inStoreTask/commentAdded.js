const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./../objective/prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.IN_STORE_REPORTING;
        const contentType = contentTypes.INSTORETASKS;
        const actionType = activityTypes.COMMENTED;
        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            setHighPriority,
            setAssignee,
            setSupervisor,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setHighPriority,
            subject: {
                en: 'Comment sent',
                ar: '',
            },
            payload,
        }, {
            recipients: setAssignee,
            subject: {
                en: 'In-store task commented',
                ar: '',
            },
            payload,
        }, {
            recipients: setSupervisor,
            subject: {
                en: 'Subordinate\'s in-store task commented',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
