const co = require('co');
const _ = require('lodash');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.AL_ALALI_PROMOTIONS_ITEMS;
        const contentType = contentTypes.PROMOTIONSITEMS;
        const actionType = activityTypes.CREATED;
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
            setAdmin,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: _.uniq([actionOriginator, contentAuthor]),
            subject: {
                en: 'Promo item published',
                ar: '',
            },
            payload,
        }, {
            recipients: [supervisor],
            subject: {
                en: 'Subordinate published promo item',
                ar: '',
            },
            payload,
        }, {
            recipients: setAdmin,
            subject: {
                en: 'Promo evaluation item received',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
