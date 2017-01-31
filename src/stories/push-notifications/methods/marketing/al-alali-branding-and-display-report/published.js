const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../../reporting/prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.AL_ALALI_BRANDING_DISPLAY_REPORT;
        const contentType = contentTypes.BRANDINGANDDISPLAY;
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
                en: 'Branding & Display report published',
                ar: '',
            },
            payload,
        }, {
            recipients: [supervisor],
            subject: {
                en: 'Subordinate published Branding & Display report',
                ar: '',
            },
            payload,
        }, {
            recipients: setEveryoneInLocation,
            subject: {
                en: 'Branding & Display report received',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
