module.exports = (PersonnelModel, myId, cb) => {
    const pipeLine = [{
        $match: {
            'vacation.cover': myId
        }
    }, {
        $group: {
            _id: null,
            ids: {
                $addToSet: '$_id'
            }
        }
    }];

    const aggregation = PersonnelModel.aggregate(pipeLine);

    aggregation.options = {
        allowDiskUse: true
    };

    aggregation.exec((err, response) => {
        if (err) {
            return cb(err);
        }
        const data = response[0] ?
            response[0].ids.concat([myId]) : [myId];

        cb(null, data);
    });
};
