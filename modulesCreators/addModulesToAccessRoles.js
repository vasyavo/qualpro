var mongoose = require('mongoose');
var CONSTANTS = require('../public/js/constants/contentType');
var env = process.env;
var ObjectId = mongoose.Types.ObjectId;
var connectOptions;
var configs;
var db;

configs = require('../config');

// connectOptions = configs.mongoConfig;
require('../models/index.js');

db = mongoose.createConnection(env.DB_HOST, env.DB_NAME, env.DB_PORT, connectOptions);
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    var accessRoleShema = mongoose.Schemas[CONSTANTS.ACCESSROLE];
    var async = require('async');
    var AccessRoleModel = db.model(CONSTANTS.ACCESSROLE, accessRoleShema);

    var commentsAccess = {
        module: 1010,
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
    };

    var superAdmin = [
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
        }, commentsAccess
    ];

    var masterAdmin = [
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
        }, commentsAccess
    ];

    var countryAdmin = [
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
        }
    ];

    var areaFiledManager = [
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
        }
    ];

    var areaInChargeManager = [
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
        }
    ];

    var salesman = [
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
        }
    ];

    var merchandiser = [
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
        }
    ];

    var cashVan = [
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
        }
    ];

    var masterUpload = [
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
        }
    ];

    var countryUpload = [
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

    AccessRoleModel.update({}, {$set: {roleAccess: []}}, {multi: true}, function (err, ressult) {
        if (err) {
            return console.error(err);
        }

        AccessRoleModel.findOneAndUpdate({level: 0}, {$push: {roleAccess: {$each: superAdmin}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

        AccessRoleModel.findOneAndUpdate({level: 1}, {$push: {roleAccess: {$each: masterAdmin}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

        AccessRoleModel.findOneAndUpdate({level: 2}, {$push: {roleAccess: {$each: countryAdmin}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

        AccessRoleModel.findOneAndUpdate({level: 3}, {$push: {roleAccess: {$each: areaFiledManager}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

        AccessRoleModel.findOneAndUpdate({level: 4}, {$push: {roleAccess: {$each: areaInChargeManager}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

        AccessRoleModel.findOneAndUpdate({level: 5}, {$push: {roleAccess: {$each: salesman}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

        AccessRoleModel.findOneAndUpdate({level: 6}, {$push: {roleAccess: {$each: merchandiser}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

        AccessRoleModel.findOneAndUpdate({level: 7}, {$push: {roleAccess: {$each: cashVan}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

        AccessRoleModel.findOneAndUpdate({level: 8}, {$push: {roleAccess: {$each: masterUpload}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

        AccessRoleModel.findOneAndUpdate({level: 9}, {$push: {roleAccess: {$each: countryUpload}}}, {
            new   : true,
            upsert: true
        }, function (err, updated) {
            if (err) {
                return console.error(err);
            }

            console.log(updated);
        });

    });
});
