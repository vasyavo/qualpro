var CONTENT_TYPES = require('../public/js/constants/contentType.js');
var allowedParams = {};

allowedParams[CONTENT_TYPES.NOTES] = {
    0: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    },
    1: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    },
    2: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    },
    3: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    },
    4: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    },
    5: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    },
    6: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    },
    7: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    },
    8: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    },
    9: {
        create: ['title', 'archived', 'theme', 'description'],
        update: ['title', 'archived', 'theme', 'description', 'filesToDelete']
    }
};

allowedParams[CONTENT_TYPES.BRANDING_ACTIVITY] = {
    0: {
        create: ['category', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    },
    1: {
        create: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    },
    2: {
        create: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    },
    3: {
        create: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    },
    4: {
        create: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    },
    5: {
        create: ['category', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    },
    6: {
        create: ['category', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    },
    7: {
        create: ['category', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    },
    8: {
        create: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    },
    9: {
        create: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'createdBy', 'save'],
        update: ['category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'dateStart', 'dateEnd', 'attachments', 'description', 'editedBy', 'save']
    }
};

allowedParams[CONTENT_TYPES.BRANDING_ACTIVITY_ITEMS] = {
    0: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    1: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    2: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    3: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    4: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    5: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    6: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    7: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    8: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    9: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    },
    10: {
        create: ['brandingAndDisplay', 'branch', 'commentText']
    }
};

allowedParams[CONTENT_TYPES.SHELFSHARES] = {
    0: {
        create: []
    },
    1: {
        create: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'totalBrandsLength', 'brands']
    },
    2: {
        create: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'totalBrandsLength', 'brands']
    },
    3: {
        create: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'totalBrandsLength', 'brands']
    },
    4: {
        create: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'totalBrandsLength', 'brands']
    },
    5: {
        create: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'totalBrandsLength', 'brands']
    },
    6: {
        create: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'totalBrandsLength', 'brands']
    },
    7: {
        create: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'totalBrandsLength', 'brands']
    },
    8: {
        create: []
    },
    9: {
        create: []
    },
    10: {
        create: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'category', 'totalBrandsLength', 'brands']
    }
};

allowedParams[CONTENT_TYPES.NOTIFICATIONS] = {
    0: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    },
    1: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    },
    2: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    },
    3: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    },
    4: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    },
    5: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    },
    6: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    },
    7: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    },
    8: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    },
    9: {
        create: ['createdBy', 'country', 'region', 'subRegion', 'retailSegment',
            'outlet', 'branch', 'position', 'recipients', 'description']
    }
};

allowedParams[CONTENT_TYPES.OBJECTIVES] = {
    0: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'status', 'efforts'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    1: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'status', 'efforts'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    2: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'status', 'efforts'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    3: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'status', 'efforts'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    4: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'status', 'efforts'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    5: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'status'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    6: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'status'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    7: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    8: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    9: {
        create            : ['title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update            : ['complete', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        createSubObjective: ['companyObjective', 'parentId', 'level', 'title', 'attachments', 'formType', 'objectiveType', 'assignedTo', 'saveObjective', 'priority', 'dateStart', 'dateEnd', 'location', 'description', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    }
};

allowedParams[CONTENT_TYPES.PROMOTIONSITEMS] = {
    0: {
        create: [],
        update: []
    },
    1: {
        create: ['outlet', 'dateStart', 'dateEnd', 'rsp', 'status', 'opening', 'sellIn', 'closingStock', 'sellOut', 'displayType', 'promotion', 'branch', 'commentText'],
        update: []
    },
    2: {
        create: ['outlet', 'dateStart', 'dateEnd', 'rsp', 'status', 'opening', 'sellIn', 'closingStock', 'sellOut', 'displayType', 'promotion', 'branch', 'commentText'],
        update: []
    },
    3: {
        create: ['outlet', 'dateStart', 'dateEnd', 'rsp', 'status', 'opening', 'sellIn', 'closingStock', 'sellOut', 'displayType', 'promotion', 'branch', 'commentText'],
        update: []
    },
    4: {
        create: ['outlet', 'dateStart', 'dateEnd', 'rsp', 'status', 'opening', 'sellIn', 'closingStock', 'sellOut', 'displayType', 'promotion', 'branch', 'commentText'],
        update: []
    },
    5: {
        create: ['outlet', 'dateStart', 'dateEnd', 'rsp', 'status', 'opening', 'sellIn', 'closingStock', 'sellOut', 'displayType', 'promotion', 'branch', 'commentText'],
        update: []
    },
    6: {
        create: ['outlet', 'dateStart', 'dateEnd', 'rsp', 'status', 'opening', 'sellIn', 'closingStock', 'sellOut', 'displayType', 'promotion', 'branch', 'commentText'],
        update: []
    },
    7: {
        create: ['outlet', 'dateStart', 'dateEnd', 'rsp', 'status', 'opening', 'sellIn', 'closingStock', 'sellOut', 'displayType', 'promotion', 'branch', 'commentText'],
        update: []
    },
    8: {
        create: []
    },
    9: {
        create: []
    }
};

allowedParams[CONTENT_TYPES.PERSONNEL] = {
    0: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'accessRole', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'sendPass', 'type', 'accessRole', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    },
    1: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'accessRole', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'sendPass', 'type', 'accessRole', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    },
    2: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'accessRole', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'sendPass', 'type', 'accessRole', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    },
    3: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    },
    4: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    },
    5: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    },
    6: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    },
    7: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    },
    8: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'accessRole', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'sendPass', 'type', 'accessRole', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    },
    9: {
        create: ['imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'accessRole', 'temp'],
        update: ['currentLanguage', 'imageSrc', 'firstName', 'lastName', 'country', 'region', 'subRegion', 'branch', 'email', 'phoneNumber', 'manager', 'position', 'dateJoined', 'description', 'vacation', 'sendPass', 'type', 'accessRole', 'oldPass', 'newPass', 'lastAccess', 'confirmed']
    }
};

allowedParams[CONTENT_TYPES.BRANCH] = {
    0: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    },
    1: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    },
    2: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    },
    3: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    },
    4: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    },
    5: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    },
    6: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    },
    7: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    },
    8: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    },
    9: {
        create: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager'],
        update: ['name', 'subRegion', 'retailSegment', 'outlet', 'address', 'linkToMap', 'manager']
    }
};

allowedParams[CONTENT_TYPES.BRAND] = {
    0: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    },
    1: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    },
    2: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    },
    3: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    },
    4: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    },
    5: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    },
    6: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    },
    7: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    },
    8: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    },
    9: {
        create: ['archived', 'imageSrc', 'name'],
        update: ['archived', 'imageSrc', 'name']
    }
};

allowedParams[CONTENT_TYPES.CATEGORY] = {
    0: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    },
    1: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    },
    2: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    },
    3: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    },
    4: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    },
    5: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    },
    6: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    },
    7: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    },
    8: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    },
    9: {
        create: ['topArchived', 'archived', 'name'],
        update: ['topArchived', 'archived', 'name']
    }
};

allowedParams[CONTENT_TYPES.COMMENT] = {
    0: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    },
    1: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    },
    2: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    },
    3: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    },
    4: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    },
    5: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    },
    6: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    },
    7: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    },
    8: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    },
    9: {
        create: ['commentText', 'objectiveId', 'context'],
        update: ['commentText', 'objectiveId']
    }
};

allowedParams[CONTENT_TYPES.COMPETITORVARIANT] = {
    0: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    },
    1: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    },
    2: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    },
    3: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    },
    4: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    },
    5: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    },
    6: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    },
    7: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    },
    8: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    },
    9: {
        create: ['name', 'category', 'archived'],
        update: ['name', 'category', 'archived']
    }
};

allowedParams[CONTENT_TYPES.DOMAIN] = {
    0: {
        create: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId'],
        update: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId']
    },
    1: {
        create: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId'],
        update: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId']
    },
    2: {
        create: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId'],
        update: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId']
    },
    3: {
        create: [],
        update: []
    },
    4: {
        create: [],
        update: []
    },
    5: {
        create: [],
        update: []
    },
    6: {
        create: [],
        update: []
    },
    7: {
        create: [],
        update: []
    },
    8: {
        create: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId'],
        update: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId']
    },
    9: {
        create: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId'],
        update: ['name', 'imageSrc', 'currency', 'archived', 'topArchived', 'type', 'parentId']
    }
};

allowedParams[CONTENT_TYPES.DISTRIBUTIONFORM] = {
    0: {
        create: ['objective'],
        update: ['objective']
    },
    1: {
        create: ['objective'],
        update: ['objective']
    },
    2: {
        create: ['objective'],
        update: ['objective']
    },
    3: {
        create: ['objective'],
        update: ['objective']
    },
    4: {
        create: [],
        update: []
    },
    5: {
        create: [],
        update: ['items']
    },
    6: {
        create: [],
        update: ['items']
    },
    7: {
        create: [],
        update: ['items']
    },
    8: {
        create: [],
        update: []
    },
    9: {
        create: [],
        update: []
    }
};

allowedParams[CONTENT_TYPES.COMPETITORITEM] = {
    0: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    },
    1: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    },
    2: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    },
    3: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    },
    4: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    },
    5: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    },
    6: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    },
    7: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    },
    8: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    },
    9: {
        create: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product'],
        update: ['name', 'packing', 'size', 'origin', 'country', 'brand', 'competitorVariant', 'archived', 'product']
    }
};

allowedParams[CONTENT_TYPES.INSTORETASKS] = {
    0: {
        create: ['title', 'description', 'objectiveType', 'priority', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update: ['title', 'description', 'objectiveType', 'priority', 'status', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    1: {
        create: ['title', 'description', 'objectiveType', 'priority', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update: ['title', 'description', 'objectiveType', 'priority', 'status', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    2: {
        create: ['title', 'description', 'objectiveType', 'priority', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update: ['title', 'description', 'objectiveType', 'priority', 'status', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    3: {
        create: ['title', 'description', 'objectiveType', 'priority', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update: ['title', 'description', 'objectiveType', 'priority', 'status', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    4: {
        create: ['title', 'description', 'objectiveType', 'priority', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update: ['title', 'description', 'objectiveType', 'priority', 'status', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    5: {
        create: ['title', 'description', 'objectiveType', 'priority', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update: ['title', 'description', 'objectiveType', 'priority', 'status', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    6: {
        create: [],
        update: ['status']
    },
    7: {
        create: [],
        update: ['status']
    },
    8: {
        create: ['title', 'description', 'objectiveType', 'priority', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update: ['title', 'description', 'objectiveType', 'priority', 'status', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    9: {
        create: ['title', 'description', 'objectiveType', 'priority', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update: ['title', 'description', 'objectiveType', 'priority', 'status', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    },
    10: {
        create: ['title', 'description', 'objectiveType', 'priority', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
        update: ['title', 'description', 'objectiveType', 'priority', 'status', 'assignedTo', 'complete', 'saveObjective', 'comments', 'attachments', 'formType', 'dateStart', 'dateEnd', 'location', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
    }
};

allowedParams[CONTENT_TYPES.VISIBILITYFORM] = {
    0: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    1: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    2: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    3: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    4: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    5: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    6: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    7: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    8: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    9: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    },
    10: {
        create: ['objective', 'description'],
        update: ['description', 'before', 'isNewFile']
    }
};

allowedParams[CONTENT_TYPES.VARIANT] = {
    0: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    },
    1: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    },
    2: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    },
    3: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    },
    4: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    },
    5: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    },
    6: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    },
    7: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    },
    8: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    },
    9: {
        create: ['name', 'category'],
        update: ['name', 'category', 'archived', 'topArchived']
    }
};

allowedParams[CONTENT_TYPES.ITEM] = {
    0: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    },
    1: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    },
    2: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    },
    3: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    },
    4: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    },
    5: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    },
    6: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    },
    7: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    },
    8: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    },
    9: {
        create: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name'],
        update: ['variant', 'category', 'country', 'topArchived', 'archived', 'origin', 'ppt', 'pptPerCase', 'rspMin', 'rspMax', 'size', 'packing', 'barCode', 'name']
    }
};

allowedParams[CONTENT_TYPES.OUTLET] = {
    0: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    },
    1: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    },
    2: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    },
    3: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    },
    4: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    },
    5: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    },
    6: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    },
    7: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    },
    8: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    },
    9: {
        create: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name'],
        update: ['archived', 'retailSegments', 'subRegions', 'imageSrc', 'name']
    }
};

allowedParams[CONTENT_TYPES.PLANOGRAM] = {
    0: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    },
    1: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    },
    2: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    },
    3: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    },
    4: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    },
    5: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    },
    6: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    },
    7: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    },
    8: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    },
    9: {
        create: ['country', 'retailSegment', 'product', 'configuration', 'photo'],
        update: ['country', 'retailSegment', 'product', 'configuration', 'photo']
    }
};

allowedParams[CONTENT_TYPES.RETAILSEGMENT] = {
    0: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    },
    1: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    },
    2: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    },
    3: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    },
    4: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    },
    5: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    },
    6: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    },
    7: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    },
    8: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    },
    9: {
        create             : ['name', 'imageSrc'],
        update             : ['name', 'imageSrc'],
        addConfiguration   : ['configuration', 'retailId'],
        updateConfiguration: ['configurationId', 'retailId', 'configuration', 'archived']
    }
};

// TODO: Delete this
allowedParams[CONTENT_TYPES.RATING] = {
    0: {
        create: ['rating', 'personnel'],
        update: ['rating']
    },
    1: {
        create: ['rating', 'personnel'],
        update: ['rating']
    },
    2: {
        create: ['rating', 'personnel'],
        update: ['rating']
    },
    3: {
        create: ['rating', 'personnel'],
        update: ['rating']
    },
    4: {
        create: ['rating', 'personnel'],
        update: ['rating']
    },
    5: {
        create: ['rating', 'personnel'],
        update: ['rating']
    },
    6: {
        create: ['rating', 'personnel'],
        update: ['rating']
    },
    7: {
        create: ['rating', 'personnel'],
        update: ['rating']
    },
    8: {
        create: ['rating', 'personnel'],
        update: ['rating']
    },
    9: {
        create: ['rating', 'personnel'],
        update: ['rating']
    }
};

allowedParams[CONTENT_TYPES.MONTHLY] = {
    0: {
        create: ['month', 'year', 'rating', 'personnel', 'individualObjectives', 'companyObjectives', 'inStoreTasks', 'submittingReports', 'target', 'achiev'],
        update: ['rating', 'target', 'achiev']
    },
    1: {
        create: ['month', 'year', 'rating', 'personnel', 'individualObjectives', 'companyObjectives', 'inStoreTasks', 'submittingReports', 'target', 'achiev'],
        update: ['rating', 'target', 'achiev']
    },
    2: {
        create: ['month', 'year', 'rating', 'personnel', 'individualObjectives', 'companyObjectives', 'inStoreTasks', 'submittingReports', 'target', 'achiev'],
        update: ['rating', 'target', 'achiev']
    },
    3: {
        create: ['month', 'year', 'rating', 'personnel', 'individualObjectives', 'companyObjectives', 'inStoreTasks', 'submittingReports', 'target', 'achiev'],
        update: []
    },
    4: {
        create: [],
        update: []
    },
    5: {
        create: [],
        update: []
    },
    6: {
        create: [],
        update: []
    },
    7: {
        create: [],
        update: []
    },
    8: {
        create: [],
        update: []
    },
    9: {
        create: [],
        update: []
    }
};

allowedParams[CONTENT_TYPES.PROMOTIONS] = {
    0: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    },
    1: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    },
    2: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    },
    3: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    },
    4: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    },
    5: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    },
    6: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    },
    7: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    },
    8: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    },
    9: {
        create: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion'],
        update: ['promotionType', 'category', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'displayType', 'barcode', 'packing', 'ppt', 'quantity', 'dateStart', 'dateEnd', 'attachments', 'status', 'savePromotion']
    }
};

allowedParams[CONTENT_TYPES.COMPETITORBRANDING] = {
    0: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    1: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    2: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    3: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    4: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    5: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    6: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    7: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    8: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    9: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    },
    10: {
        create: ['description', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location', 'displayType', 'dateStart', 'dateEnd'],
        update: []
    }
};

allowedParams[CONTENT_TYPES.COMPETITORPROMOTION] = {
    0: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    1: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    2: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    3: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    4: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    5: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    6: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    7: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    8: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    9: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    },
    10: {
        create: ['description', 'packingType', 'category', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'promotion', 'price', 'packing', 'expiry', 'displayType', 'dateStart', 'dateEnd', 'commentText'],
        update: []
    }
};

allowedParams[CONTENT_TYPES.ACHIEVEMENTFORM] = {
    0: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    },
    1: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    },
    2: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    },
    3: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    },
    4: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    },
    5: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    },
    6: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    },
    7: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    },
    8: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    },
    9: {
        create: ['description', 'additionalComment', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'location'],
        update: []
    }
};

allowedParams[CONTENT_TYPES.NEWPRODUCTLAUNCH] = {
    0: {
        create: ['additionalComment', 'category', 'packingType', 'category_name', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    1: {
        create: ['additionalComment', 'category', 'packingType', 'category_name', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    2: {
        create: ['additionalComment', 'category', 'packingType', 'category_name', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    3: {
        create: ['additionalComment', 'category', 'packingType', 'category_name', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    4: {
        create: ['additionalComment', 'category', 'packingType', 'category_name', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    5: {
        create: ['additionalComment', 'category', 'packingType', 'category_name', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    6: {
        create: ['additionalComment', 'category', 'packingType', 'category_name', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    7: {
        create: ['additionalComment', 'category', 'packingType', 'category_name', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    8: {
        create: ['additionalComment', 'category', 'packingType', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    9: {
        create: ['additionalComment', 'category', 'packingType', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    },
    10: {
        create: ['additionalComment', 'category', 'packingType', 'variant', 'brand', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'origin', 'price', 'packing', 'location', 'displayType', 'distributor', 'shelfLifeStart', 'shelfLifeEnd'],
        update: []
    }
};

allowedParams[CONTENT_TYPES.BIYEARLY] = {
    0: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    },
    1: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    },
    2: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    },
    3: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    },
    4: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    },
    5: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    },
    6: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    },
    7: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    },
    8: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    },
    9: {
        create: ['rating', 'personnel', 'details', 'dataKey'],
        update: ['rating', 'personnel', 'details']
    }
};

allowedParams[CONTENT_TYPES.PRICESURVEY] = {
    0: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    },
    1: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    },
    2: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    },
    3: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    },
    4: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    },
    5: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    },
    6: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    },
    7: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    },
    8: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    },
    10: {
        create: ['category', 'variant', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'items', 'total'],
        update: []
    }
};

allowedParams[CONTENT_TYPES.CONTRACTSYEARLY] = {
    0: {
        create: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly'],
        update: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly']
    },
    1: {
        create: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly'],
        update: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly']
    },
    2: {
        create: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly'],
        update: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly']
    },
    3: {
        create: [],
        update: []
    },
    4: {
        create: [],
        update: []
    },
    5: {
        create: [],
        update: []
    },
    6: {
        create: [],
        update: []
    },
    7: {
        create: [],
        update: []
    },
    8: {
        create: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly'],
        update: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly']
    },
    9: {
        create: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly'],
        update: ['type', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsYearly']
    }
};

allowedParams[CONTENT_TYPES.CONTRACTSSECONDARY] = {
    0: {
        create: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary'],
        update: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary']
    },
    1: {
        create: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary'],
        update: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary']
    },
    2: {
        create: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary'],
        update: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary']
    },
    3: {
        create: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary'],
        update: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary']
    },
    4: {
        create: [],
        update: []
    },
    5: {
        create: [],
        update: []
    },
    6: {
        create: [],
        update: []
    },
    7: {
        create: [],
        update: []
    },
    8: {
        create: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary'],
        update: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary']
    },
    9: {
        create: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary'],
        update: ['type', 'category', 'activity', 'promotion', 'displayType', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'budget', 'actual', 'salesTarget', 'dateStart', 'dateEnd', 'description', 'archived', 'attachments', 'saveContractsSecondary']
    }
};

allowedParams[CONTENT_TYPES.DOCUMENTS] = {
    0: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    },
    1: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    },
    2: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    },
    3: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    },
    4: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    },
    5: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    },
    6: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    },
    7: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    },
    8: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    },
    9: {
        create: ['title', 'archived', 'attachments'],
        update: ['title', 'archived']
    }
};

allowedParams[CONTENT_TYPES.QUESTIONNARIES] = {
    0: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text']
    },
    1: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text']
    },
    2: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text']
    },
    3: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text', 'answers']
    },
    4: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text', 'answers']
    },
    5: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text', 'answers']
    },
    6: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text', 'answers']
    },
    7: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text', 'answers']
    },
    8: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text']
    },
    9: {
        create: ['title', 'dueDate', 'send', 'questions', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'position', 'personnel', 'location'],
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text']
    },
    10: {
        update: ['personnelId', 'questionnaryId', 'questionId', 'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'optionIndex', 'text']
    }
};

module.exports = allowedParams;
