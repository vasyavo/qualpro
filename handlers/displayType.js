var Category = function (db, event) {
    var mongoose = require('mongoose');
    var CONSTANTS = require('../constants/mainConstants');
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var modelAndSchemaName = CONTENT_TYPES.DISPLAYTYPE;
    var schema = mongoose.Schemas[modelAndSchemaName];
    var Model = db.model(modelAndSchemaName, schema);

    var access = require('../helpers/access')(db);

    this.getAll = function (req, res, next) {
        var isMobile = req.isMobile;
        var query = req.query || {};
        var page = query.page || 1;
        var limit = parseInt(query.count, 10) || parseInt(CONSTANTS.LIST_COUNT, 10);
        var skip = (page - 1) * limit;
        var data = req.query || {};

        delete data.page;
        delete data.count;

        Model.find(data)
            .sort({_id: 1})
            .limit(limit)
            .skip(skip)
            .exec(function (err, result) {
                var response = result;
                if (err) {
                    return next(err);
                }
                if (isMobile) {
                    if (result && result.length) {
                        response = {
                            data : result,
                            total: result.length
                        };
                    } else {
                        response = {
                            data : [],
                            total: 0
                        };
                    }
                }

                next({status: 200, body: response});
            });
    };

    this.getById = function (req, res, next) {
        var id = req.params.id;

        Model.findById(id)
            .exec(function (err, result) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(result);
            });
    };

};
module.exports = Category;
