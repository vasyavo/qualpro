const co = require('co');
const _ = require('lodash');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.AL_ALALI_PROMO_EVALUATION;
        const contentType = contentTypes.PROMOTIONS;
        const actionType = activityTypes.EXPIRED;
        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            actionOriginator,
            contentAuthor,
            supervisor,
            setEveryoneInLocation,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: _.uniq([
                actionOriginator,
                contentAuthor,
                supervisor,
                ...setEveryoneInLocation,
            ]),
            subject: {
                en: 'Promo evaluation expired',
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
