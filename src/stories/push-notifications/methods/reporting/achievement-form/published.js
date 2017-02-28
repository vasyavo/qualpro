const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.ACHIEVEMENT_FORM;
        const contentType = contentTypes.ACHIEVEMENTFORM;
        const actionType = activityTypes.CREATED;
        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            actionOriginator,
            supervisor,
            setEveryoneInLocation,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: [actionOriginator],
            subject: {
                en: 'Achievement form published',
                ar: '',
            },
            payload,
        }, {
            recipients: [supervisor],
            subject: {
                en: 'Subordinate published achievement form',
                ar: '',
            },
            payload,
        }, {
            recipients: setEveryoneInLocation,
            subject: {
                en: 'Achievement form received',
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
