const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.CONTRACT_YEARLY_AND_VISIBILITY;
        const contentType = contentTypes.CONTRACTSYEARLY;
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
        const isYearly = extendedOptions.body.type === 'yearly';

        const groups = [{
            recipients: setEveryoneInLocation,
            subject: {
                en: `${isYearly ? 'Yearly' : 'Visibility'} Contract published`,
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
