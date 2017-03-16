const ObjectiveModel = require('./../../../types/objective/model');
const PersonnelModel = require('./../../../types/personnel/model');
const updateChildObjective = require('./updateChildObjective');

module.exports = (objective, cb) => {
    const objectiveLevel = objective.get('level');
    const objectiveId = objective.get('_id');
    const query = {
        [`parent.${objectiveLevel}`]: objectiveId,
    };

    ObjectiveModel.find(query)
        .lean()
        .exec((err, setObjective) => {
            if (err) {
                return cb(err);
            }

            if (setObjective) {
                PersonnelModel.findById(objective.assignedTo[0])
                    .lean()
                    .exec((err, personnel) => {
                        if (err) {
                            return cb(err);
                        }

                        ObjectiveModel.findByIdAndUpdate(objectiveId, {
                            $set: {
                                country: personnel.country,
                                region: personnel.region,
                                subRegion: personnel.subRegion,
                                branch: personnel.branch,
                            },
                        }, {
                            runValidators: true,
                        }, (err) => {
                            if (err) {
                                return cb(err);
                            }

                            updateChildObjective({
                                setObjectiveId: setObjective.map(item => item._id),
                                assignedTo: objective.assignedTo,
                            });
                        });
                    });
            }

            cb(null, objective);
        });
};
