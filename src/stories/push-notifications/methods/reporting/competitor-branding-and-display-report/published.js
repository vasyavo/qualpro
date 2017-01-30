const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.COMPETITOR_BRANDING_DISPLAY_REPORT;
        const contentType = contentTypes.COMPETITORBRANDING;
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
                en: 'Branding and display report published',
                ar: '',
            },
            payload,
        }, {
            recipients: [supervisor],
            subject: {
                en: 'Subordinate published report',
                ar: '',
            },
            payload,
        }, {
            recipients: setEveryoneInLocation,
            subject: {
                en: 'Competitor branding and display report received',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
