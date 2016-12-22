const _ = require('underscore');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');

const $defProjection = {
    _id: 1,
    title: 1,
    dueDate: 1,
    country: 1,
    region: 1,
    subRegion: 1,
    retailSegment: 1,
    outlet: 1,
    branch: 1,
    countAll: 1,
    countAnswered: 1,
    status: 1,
    questions: 1,
    location: 1,
    editedBy: 1,
    createdBy: 1,
    creationDate: 1,
    updateDate: 1,
    position: 1,
    personnels: 1
};

module.exports = (options, callback) => {
    var aggregateHelper;
    var pipeLine = [];
    var aggregation;
    var id = options.id || '';
    var isMobile = options.isMobile;

    aggregateHelper = new AggregationHelper($defProjection);

    pipeLine.push({
        $match: {
            _id: id
        }
    });

    if (isMobile) {
        pipeLine.push({
            $project: aggregateHelper.getProjection({
                creationDate: '$createdBy.date',
                updateDate  : '$editedBy.date'
            })
        });
    }

    pipeLine.push({
        $project: aggregateHelper.getProjection({
            lastDate: {
                $ifNull: [
                    '$editedBy.date',
                    '$createdBy.date'
                ]
            }
        })
    });

    aggregation = ConsumersSurveyModel.aggregate(pipeLine);

    aggregation.options = {
        allowDiskUse: true
    };

    aggregation.exec(function (err, model) {
        if (err) {
            return callback(err);
        }

        model = model[0];

        if (model) {
            if (model.title) {
                model.title = {
                    en: _.unescape(model.title.en),
                    ar: _.unescape(model.title.ar)
                };
            }

            if (model.questions && model.questions.length) {
                model.questions = _.map(model.questions, function (question) {
                    if (question.title) {
                        question.title = {
                            en: _.unescape(question.title.en),
                            ar: _.unescape(question.title.ar)
                        };
                    }
                    if (question.options && question.options.length) {
                        question.options = _.map(question.options, function (option) {
                            if (option) {
                                return {
                                    en: _.unescape(option.en),
                                    ar: _.unescape(option.ar)
                                };
                            }
                        });
                    }
                    return question;
                });
            }
        }

        return callback(null, model);
    });
};
