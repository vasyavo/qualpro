const async = require('async');
const logger = require('../utils/logger');
const AccessRoleModel = require('../types/accessRole/model');

const commentsAccess = {
    module: 1010,
    cms: {
        archive: false,
        edit: false,
        write: true,
        read: true
    },
    mobile: {
        archive: false,
        edit: false,
        write: true,
        read: true
    }
};

const superAdmin = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 22,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 23,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : true,
        write: true,
        read : true
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 28,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 29,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 32,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 38,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 40,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    },
    {
        module: 44,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    },
    commentsAccess
];

const masterAdmin = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 3,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 10,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
{
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 22,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 23,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : true,
        write: true,
        read : true
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 28,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 29,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 32,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 38,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
},
{
    module: 40,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
},
{
    module: 1000,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 1001,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    }, commentsAccess
];

const countryAdmin = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 22,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 23,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : true,
        write: true,
        read : true
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 28,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 29,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 32,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 38,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 40,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    }
];

const areaFiledManager = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 22,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 23,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: true,
        read : true
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 28,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 29,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 32,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 38,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 40,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        }
    }
];

const areaInChargeManager = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 22,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 23,
    cms   : {
        edit : false,
        write: false,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 28,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 29,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 32,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 38,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 40,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        }
    }
];

const salesman = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 22,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 23,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : false,
        write: false,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 28,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 29,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 32,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 38,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: 40,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        }
    }
];

const merchandiser = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 22,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    }
}, {
    module: 23,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : false,
        write: false,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 28,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 29,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 32,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 38,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: 40,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        }
    }
];

const cashVan = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 2,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : false,
        edit    : true,
        write   : false,
        read    : true,
        evaluate: true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 10,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    }
}, {
    module: 22,
    cms   : {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : false
    }
}, {
    module: 23,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : false,
        write: false,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 28,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 29,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 30,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 32,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
}, {
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : false
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 38,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: 40,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : false
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : false
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        }
    }
];

const masterUpload = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 10,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : false,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 22,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 23,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 28,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 29,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 32,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 38,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 40,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
{
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
},
    {
        module: 43,
        cms   : {
            archive: false,
            edit   : true,
            write  : false,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : true,
            read   : false
        }
    }, {
        module: 44,
        cms   : {
            archive: false,
            edit   : true,
            write  : true,
            read   : true
        },
        mobile: {
            archive: false,
            edit   : false,
            write  : false,
            read   : true
        }
    }
];

const countryUpload = [
{
    module: 1,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 2,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 3,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 103,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 104,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 105,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 4,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 5,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 6,
    cms   : {
        archive : true,
        edit    : true,
        write   : true,
        read    : true,
        evaluate: false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 7,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 10,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 11,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 12,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : false,
        read   : true
    }
}, {
    module: 13,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 14,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}, {
    module: 15,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 16,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 17,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 18,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
}, {
    module: 19,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 20,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 21,
    cms   : {
        upload: true,
        edit  : false,
        write : false,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : false,
        write : false,
        read  : true
    }
}, {
    module: 22,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: false,
        edit  : true,
        write : true,
        read  : true
    }
}, {
    module: 23,
    cms   : {
        edit : false,
        write: false,
        read : false
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 24,
    cms   : {
        edit : false,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : false
    }
}, {
    module: 25,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 26,
    cms   : {
        edit : true,
        write: true,
        read : true
    },
    mobile: {
        edit : false,
        write: false,
        read : true
    }
}, {
    module: 27,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 28,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 29,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
}, {
    module: 30,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
{
    module: 32,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 33,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 34,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 35,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : false
    }
},
{
    module: 36,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 37,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 38,
    cms   : {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 39,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 41,
    cms   : {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : true,
        read   : true
    }
},
{
    module: 40,
    cms   : {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    },
    mobile: {
        upload: true,
        edit  : true,
        write : true,
        read  : true
    }
},
{
    module: 42,
    cms   : {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: true,
        edit   : true,
        write  : true,
        read   : true
    }
},
commentsAccess,
{
    module: 31,
    cms   : {
        archive: false,
        edit   : true,
        write  : true,
        read   : true
    },
    mobile: {
        archive: false,
        edit   : false,
        write  : false,
        read   : true
    }
}
];

const accessRolesData = {
    0: superAdmin,
    1: masterAdmin,
    2: countryAdmin,
    3: areaFiledManager,
    4: areaInChargeManager,
    5: salesman,
    6: merchandiser,
    7: cashVan,
    8: masterUpload,
    9: countryUpload
};

const accessRoles = [];

for (let level in accessRolesData) {
    const roleAccess = accessRolesData[level];

    accessRoles.push({
        roleAccess
    })
}

const levels = [
    'Super User',
    'Master Admin',
    'Country Admin',
    'Area Manager',
    'Area in charge',
    'Sales Man',
    'Merchandiser',
    'Cash van',
    'Master uploader',
    'Country uploader'
];

const generate = (callback) => {
    async.waterfall([

        (cb) => {
            AccessRoleModel.update({}, {
                $set: {
                    roleAccess: []
                }
            }, {
                multi: true
            }, cb);
        },

        (result, cb) => {
            async.eachOf(accessRolesData, (roleAccess, level, eachCb) => {
                const name = levels[level];

                AccessRoleModel.findOneAndUpdate({
                    level
                }, {
                    $set: {
                        name: {
                            en: name,
                            ar: name
                        },
                        level,
                        roleAccess
                    }
                }, {
                    new: true,
                    upsert: true
                }, (err, model) => {
                    if (model) {
                        accessRoles[level].id = model._id.toString();
                    }

                    eachCb(err, model);
                });
            }, cb);
        }

    ], (err) => {
        if (err) {
            logger.error('Fail to setup access roles!', err);
            return callback(err);
        }

        logger.info('Setup is done for access roles.');
        callback();
    });
};

module.exports = {
    generate,
    accessRoles
};
