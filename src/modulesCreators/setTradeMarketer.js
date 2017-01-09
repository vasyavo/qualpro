var PositionModel = require('./../types/position/model');
module.exports = function (wCb){
    PositionModel.update({'name.en': 'TRADE MARKETER'},
        {
            name         : {
                en: 'TRADE MARKETER'
            },
            whoCanRW     : 'everyone',
            profileAccess: [],
            groups : {
                group : [],
                users : [],
                owner : null
            },
            editedBy : {
                date : new Date(),
                user : null
            },
            createdBy : {
                date : new Date(),
                user : null
            },
            numberOfPersonnels : 0
        }, {upsert: true}, wCb);
};

