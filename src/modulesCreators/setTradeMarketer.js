var mongoose = require('mongoose');

var dbUri = 'mongodb://localhost:27017/qualPro';
mongoose.connect(dbUri);
mongoose.Schemas = {};
var PositionModel = require('./../types/position/model');

PositionModel.update({'name.en': 'TRADE MARKETER'},
    {
        name              : {
            en: 'TRADE MARKETER'
        },
        whoCanRW          : 'everyone',
        profileAccess     : [],
        groups            : {
            group: [],
            users: [],
            owner: null
        },
        editedBy          : {
            date: new Date(),
            user: null
        },
        createdBy         : {
            date: new Date(),
            user: null
        },
        numberOfPersonnels: 0
    }, {upsert: true}, (err)=>{
        if (err){
            console.log(err);
        }
        console.log('GOOD');
    });

