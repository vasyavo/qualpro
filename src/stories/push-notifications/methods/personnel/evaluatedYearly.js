const co = require('co');
const _ = require('lodash');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.PERSONNEL;
        const contentType = contentTypes.PERSONNEL;
        const actionType = contentTypes.UPDATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            setEveryoneInLocation,
            name,
            } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setEveryoneInLocation,
            subject: {
                en: `Personnel ${name.en} is evaluated bi-yearly`,
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};
