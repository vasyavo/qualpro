const ACL_MODULES = require('./../../../constants/aclModulesNames');

module.exports = {
    module: ACL_MODULES.CONSUMER_SURVEY,
    cms: {},
    mobile: {
        write: true,
    }
};