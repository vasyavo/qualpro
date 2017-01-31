var CONTENT_TYPES = require('../public/js/constants/contentType');
var ACL_ROLES = require('./aclRolesNames');
var schemas = require('../validationSchemas');

var schemasByRole = {};

schemasByRole[CONTENT_TYPES.CONTACT_US] = {};

schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.SUPER_ADMIN] = {
    create: schemas.contactUs.create,
    read: schemas.contactUs.getAll,
    update: schemas.contactUs.update
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.MASTER_ADMIN] = {
    create: schemas.contactUs.create,
    read: schemas.contactUs.getAll,
    update: schemas.contactUs.update
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.COUNTRY_ADMIN] = {
    create: schemas.contactUs.create,
    read: schemas.contactUs.getAll,
    update: schemas.contactUs.update
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
    create: schemas.contactUs.create,
    read: schemas.contactUs.getAll,
    update: schemas.contactUs.update
};
schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.COUNTRY_UPLOADER] = {
    create: schemas.contactUs.create,
    read: schemas.contactUs.getAll,
    update: schemas.contactUs.update
};

schemasByRole[CONTENT_TYPES.CONTACT_US][ACL_ROLES.TRADE_MARKETER] = {
    create: schemas.contactUs.create,
};

schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY] = {};

schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.SUPER_ADMIN] = {
    create: schemas.brandingAndDisplay.create,
    read: schemas.brandingAndDisplay.getAll,
    update: schemas.brandingAndDisplay.update
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.MASTER_ADMIN] = {
    create: schemas.brandingAndDisplay.create,
    read: schemas.brandingAndDisplay.getAll,
    update: schemas.brandingAndDisplay.update
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.COUNTRY_ADMIN] = {
    create: schemas.brandingAndDisplay.create,
    read: schemas.brandingAndDisplay.getAll,
    update: schemas.brandingAndDisplay.update
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.AREA_MANAGER] = {
    create: schemas.brandingAndDisplay.create,
    read: schemas.brandingAndDisplay.getAll
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.AREA_IN_CHARGE] = {
    create: schemas.brandingAndDisplay.create,
    read: schemas.brandingAndDisplay.getAll
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.SALES_MAN] = {
    create: schemas.brandingAndDisplay.create
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.MERCHANDISER] = {
    create: schemas.brandingAndDisplay.create
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.CASH_VAN] = {
    create: schemas.brandingAndDisplay.create
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.MASTER_UPLOADER] = {
    create: schemas.brandingAndDisplay.create,
    read: schemas.brandingAndDisplay.getAll,
    update: schemas.brandingAndDisplay.update
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.COUNTRY_UPLOADER] = {
    create: schemas.brandingAndDisplay.create,
    read: schemas.brandingAndDisplay.getAll,
    update: schemas.brandingAndDisplay.update
};
schemasByRole[CONTENT_TYPES.BRANDING_AND_DISPLAY][ACL_ROLES.TRADE_MARKETER] = {
    create: schemas.brandingAndDisplay.create,
    read: schemas.brandingAndDisplay.getAll,
    update: schemas.brandingAndDisplay.update
};

schemasByRole[CONTENT_TYPES.VISIBILITYFORM] = {};

schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.SUPER_ADMIN] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};
schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.MASTER_ADMIN] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};
schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.COUNTRY_ADMIN] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};
schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.AREA_MANAGER] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};
schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.AREA_IN_CHARGE] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};
schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.SALES_MAN] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};
schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.MERCHANDISER] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};
schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.CASH_VAN] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};
schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.MASTER_UPLOADER] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};
schemasByRole[CONTENT_TYPES.VISIBILITYFORM][ACL_ROLES.COUNTRY_UPLOADER] = {
    create: schemas.visibilityForm.create,
    update: schemas.visibilityForm.update
};

module.exports = schemasByRole;
