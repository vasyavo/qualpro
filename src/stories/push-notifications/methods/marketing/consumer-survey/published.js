const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../al-alali-questionnaire/prototypeUpdated');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.CONSUMER_SURVEY;
        const contentType = contentTypes.CONSUMER_SURVEY;
        const actionType = activityTypes.CREATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            setEveryoneInLocation,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setEveryoneInLocation,
            subject: {
                en: 'Consumer Survey published',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
