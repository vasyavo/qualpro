const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./prototypeUpdated');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.AL_ALALI_BRANDING_ACTIVITY;
        const contentType = contentTypes.MARKETING_CAMPAIGN;
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
                en: 'Marketing Campaign published',
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
