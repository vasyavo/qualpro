var CONTENT_TYPES = require('../public/js/constants/contentType');
var ACL_ROLES = require('./aclRolesNames');
var schemas = require('../validationSchemas')

var schemasByRole = {};

schemasByRole[CONTENT_TYPES.CONTACT_US] = {}

schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.SUPER_ADMIN] = {
    create: schemas.contactUs.create
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.MASTER_ADMIN] = {
    create: schemas.contactUs.create
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.COUNTRY_ADMIN] = {
    create: schemas.contactUs.create
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.AREA_MANAGER] = {
    create: schemas.contactUs.create
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.AREA_IN_CHARGE] = {
    create: schemas.contactUs.create
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.SALES_MAN] = {
    create: schemas.contactUs.create
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.MERCHANDISER] = {
    create: schemas.contactUs.create
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.CASH_VAN] = {
    create: schemas.contactUs.create
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.MASTER_UPLOADER] = {
    create: schemas.contactUs.create
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.COUNTRY_UPLOADER] = {
    create: schemas.contactUs.create
};

module.exports = schemasByRole;
