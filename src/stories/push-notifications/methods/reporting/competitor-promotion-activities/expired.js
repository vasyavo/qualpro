const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.COMPETITOR_PROMOTION_ACTIVITY;
        const contentType = contentTypes.COMPETITORPROMOTION;
        const actionType = activityTypes.UPDATED;
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
            recipients: [
                actionOriginator,
                supervisor,
                ...setEveryoneInLocation,
            ],
            subject: {
                en: 'Competitor Promotion activities expired',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups, { moduleId });
    });
};
