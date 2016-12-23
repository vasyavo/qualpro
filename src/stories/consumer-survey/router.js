require('./validation/allowedBodyData');
require('./validation/validationFuntion');

const Router = require('express').Router;

const router = new Router();

router.get('/', (req, res, next) => {
    res.status(200).send({
        data : [{
            _id : '123iqrg23iu723h84rg484f9',
            branch : null,
            countAll : 23,
            countAnswered : 9,
            country : ['583720173a90064c13696622'],
            createdBy : {
                date : new Date(),
                user : {
                    _id : '5837202b3a90064c13697a4b',
                    accessRole : {
                        _id : "5837200e3a90064c13696319",
                        name : {
                            ar: "مسؤول التطبيق الرئيسي",
                            en : "Master Admin"
                        },
                        level : 1
                    },
                    firstName : {
                        ar : '',
                        en : 'Master'
                    },
                    lastName : {
                        ar : '',
                        en : 'Admin'
                    },
                    position : {
                        _id : '583720173a90064c1369661f',
                        name : {
                            ar : '',
                            en : 'Customer Success'
                        }
                    }
                }
            },
            creationDate : null,
            dueDate : new Date(),
            editedBy : {
                date : new Date(),
                user : '5837202b3a90064c13697a4b'
            },
            location : {
                ar : '',
                en : "UNITED ARAB EMIRATES"
            },
            outlet : null,
            questions : [{
                _id : '5853acef50b46d003955ee59',
                options : [],
                title : {
                    ar : '',
                    en : 'What is your name?'
                },
                type : 'fullAnswer'
            }, {
                _id : '5853acef50b46d003955ee56',
                options : [{
                    ar : '',
                    en : '16-18'
                }, {
                    ar : '',
                    en : '18-25'
                }],
                title : {
                    ar : '',
                    en : 'How old are you?'
                },
                type : 'multiChoice'
            }],
            region : null,
            retailSegment : null,
            status : 'draft',
            subRegion : null,
            title : {
                ar : '',
                en : 'Task'
            },
            total : 1,
            updateDate : null
        }],
        total : 1
    });
});

router.get('/filters-on-create', require('./routes/getFiltersOnCreate'));
router.post('/', require('./routes/postSurvey'));
router.post('/answer', require('./routes/leaveAnswer'));

module.exports = router;
