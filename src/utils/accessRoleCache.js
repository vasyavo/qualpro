const cachedAccessRoles = require('./../modulesCreators/addModulesToAccessRoles').accessRoles;
const accessRoles = require('./../constants/aclRolesNames');

const setHighAdmins = cachedAccessRoles
    .filter(role => ~[
        accessRoles.MASTER_ADMIN,
        accessRoles.TRADE_MARKETER,
    ].indexOf(role))
    .map(role => role._id);

module.exports = {
    setHighAdmins,
};
