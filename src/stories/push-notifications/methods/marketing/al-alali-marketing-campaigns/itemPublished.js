const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../al-alali-questionnaire/prototypeItemPublished');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.AL_ALALI_BRANDING_ACTIVITY;
        const contentType = contentTypes.MARKETING_CAMPAIGN_ITEM;
        const actionType = activityTypes.CREATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            actionOriginator,
            payload,
            setEveryoneInLocation,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setEveryoneInLocation,
            subject: {
                en: 'Marketing Campaign item published',
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
