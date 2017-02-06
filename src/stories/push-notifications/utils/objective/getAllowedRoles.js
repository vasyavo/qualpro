const accessRoles = require('./../../../../constants/aclRolesNames');
const contentTypes = require('./../../../../public/js/constants/contentType');

module.exports = (options) => {
    const { context } = options;
    const setAllowedRole = [
        accessRoles.MASTER_ADMIN,
        accessRoles.MASTER_UPLOADER,
        accessRoles.COUNTRY_ADMIN,
        accessRoles.COUNTRY_UPLOADER,
        accessRoles.AREA_MANAGER,
        accessRoles.AREA_IN_CHARGE,
    ];

    // Trade Marketer shouldn't see events related to Objective module
    if (context === contentTypes.INSTORETASKS) {
        setAllowedRole.push(accessRoles.TRADE_MARKETER);
    }

    return setAllowedRole;
};
