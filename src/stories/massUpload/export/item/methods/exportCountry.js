const DomainModel = require('../../../../../types/domain/model');

function*  getCountriesForExport() {
    const pipeLine = [{
        $match: {
            type: 'country'
        }
    }, {
        $sort: {
            'name.en': 1
        }
    }, {
        $project: {
            _id     : 0,
            id      : '$_id',
            enName  : {$toUpper: '$name.en'},
            arName  : {$toUpper: '$name.ar'},
            currency: {$toUpper: '$currency'},
            type    : '$type',
            parent  : {
                $literal: 'null'
            }
        }
    }];

    return yield DomainModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getCountriesForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
