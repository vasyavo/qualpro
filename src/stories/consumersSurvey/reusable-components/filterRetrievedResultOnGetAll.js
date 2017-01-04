const _ = require('underscore');
const moment = require('moment');
const isValidObjectId = require('bson-objectid').isValid;

module.exports = (options, cb) => {
    const personnel = options.personnel;
    const accessRoleLevel = options.accessRoleLevel;
    const result = options.result;
    const personnelId = personnel._id.toString();

    if (result.length) {
        result[0].data = result[0].data
            .filter((item) => (item))
            .map((model) => {
                if (model.title) {
                    model.title = {
                        en: _.unescape(model.title.en),
                        ar: _.unescape(model.title.ar)
                    };
                }

                if (model.startDate) {
                    model.startDate = moment(model.startDate).format('DD.MM.YYYY');
                }

                if (model.questions && model.questions.length) {
                    model.questions = model.questions
                        .filter((item) => (item))
                        .map((question) => {
                            if (question.title) {
                                question.title = {
                                    en: _.unescape(question.title.en),
                                    ar: _.unescape(question.title.ar)
                                };
                            }

                            if (question.options && question.options.length) {
                                question.options = question.options
                                    .filter((item) => (item))
                                    .map((option) => {
                                        return {
                                            en: _.unescape(option.en),
                                            ar: _.unescape(option.ar)
                                        };
                                    });
                            }

                            return question;
                        });
                }

                return model;
            });
    }

    const body = result && result[0] ?
        result[0] : { data: [], total: 0 };

    /*if (accessRoleLevel !== 1) {
        body.data = body.data.filter((question) => {
            const creator = question.createdBy.user;

            let isCreator = null;

            if (isValidObjectId(creator)) {
                // fixme: should check it here as sync aggregation do not includes projection for $createdBy.user
                isCreator = creator && creator.toString() === personnelId;
            } else {
                // fixme: if $createdBy.user already projected then get only _id
                isCreator = creator && creator._id.toString() === personnelId;
            }

            return isCreator;
        });

        body.total = body.data.length;
    }*/

    cb(null, body);
};
