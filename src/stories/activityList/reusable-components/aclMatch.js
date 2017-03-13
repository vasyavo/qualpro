const _ = require('lodash');
const modulesToAccessRoles = require('../../../modulesCreators/addModulesToAccessRoles');
const ACTIVITY_TYPES = require('../../../constants/activityTypes');
const ACL_MODULES_NAMES = require('../../../constants/aclModulesNames');

module.exports = ({ currentUser, queryObject }) => {
    const aclConfigs = modulesToAccessRoles.accessRoles;
    const aclConfig = _.find(aclConfigs, (config) => {
        return +config.level === currentUser.accessRoleLevel;
    });
    const aclMatch = {
        $and: [],
    };
    const deniedModules = [];

    aclConfig.roleAccess.forEach((moduleAccess) => {
        if (!moduleAccess.cms.read && !moduleAccess.mobile.read) {
            deniedModules.push(moduleAccess.module);
        }
    });

    // if queryObject has module filter by not denied modules
    if (queryObject.module && queryObject.module.$in && _.difference(queryObject.module.$in, deniedModules).length === queryObject.module.$in.length) {
        aclMatch.module = queryObject.module;
    } else {
        aclMatch.module = { $nin: deniedModules };
    }

    aclMatch.$and.push({
        $or: [
            {
                $and: [
                    {
                        actionType: ACTIVITY_TYPES.SAVED_AS_DRAFT,
                    },
                    {
                        'createdBy.user': currentUser._id,
                    },
                ],
            },
            {
                actionType: {
                    $ne: ACTIVITY_TYPES.SAVED_AS_DRAFT,
                },
            },
        ],
    });

    aclMatch.$and.push({
        $or: [
            {
                $and: [
                    {
                        module: { $in: [ACL_MODULES_NAMES.DOCUMENT, ACL_MODULES_NAMES.NOTE] },
                    },
                    {
                        'createdBy.user': currentUser._id,
                    },
                ],
            },
            {
                module: {
                    $nin: [ACL_MODULES_NAMES.DOCUMENT, ACL_MODULES_NAMES.NOTE],
                },
            },
        ],
    });

    return aclMatch;
};
