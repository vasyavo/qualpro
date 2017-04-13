const ACL_MODULES = require('./../../../constants/aclModulesNames');

module.exports = {
    module: ACL_MODULES.CONSUMER_SURVEY,
    cms: {
        read: true,
    },
    mobile: {
        read: true,
        write: true,
        edit : true
    }
};
