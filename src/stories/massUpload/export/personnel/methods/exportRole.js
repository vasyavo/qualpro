const AccessRoleModel = require('../../../../../types/accessRole/model');

function*  getRoleForExport() {
    const pipeLine = [{
        $sort: {
            'createdBy.date': 1
        }
    }, {
        $project: {
            _id   : 0,
            id    : {$ifNull: ['$_id', '']},
            enName: {$ifNull: ['$name.en', '']},
            arName: {$ifNull: ['$name.ar', '']},
        }
    }];

    return yield AccessRoleModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getRoleForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
