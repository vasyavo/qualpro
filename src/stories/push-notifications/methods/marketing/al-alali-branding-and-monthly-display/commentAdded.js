const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../../reporting/prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.AL_ALALI_BRANDING_DISPLAY_REPORT;
        const contentType = contentTypes.BRANDING_AND_MONTHLY_DISPLAY;
        const actionType = activityTypes.COMMENTED;
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
                en: 'Comment sent',
                ar: '',
            },
            payload,
        }, {
            recipients: [
                ...setEveryoneInLocation,
                supervisor,
            ],
            subject: {
                en: 'Branding & Monthly display commented',
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
