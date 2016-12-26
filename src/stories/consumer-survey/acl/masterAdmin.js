const ACL_MODULES = require('./../../../constants/aclModulesNames');

module.exports = {
    module: ACL_MODULES.CONSUMER_SURVEY,
    cms: {
        write: true,
        edit: true,
        read : true
    },
    mobile: {
        read: true,
        write: true
    }
};
