var mongoose = require('mongoose');
var _ = require('lodash');
var CONTENT_TYPES = require('../public/js/constants/contentType.js');

var Module = function (db) {
    var moduleSchema = mongoose.Schemas['module'];
    var rolesSchema = mongoose.Schemas[CONTENT_TYPES.ACCESSROLE];
    var personnelSchema = mongoose.Schemas[CONTENT_TYPES.PERSONNEL];

    this.getAll = function (req, res, next) {
        var Module = db.model('module', moduleSchema);
        var Roles = db.model(CONTENT_TYPES.ACCESSROLE, rolesSchema);
        var Personnel = db.model(CONTENT_TYPES.PERSONNEL, personnelSchema);
        var isMobile = !!req.isMobile;
        var type = isMobile ? 'mobile' : 'cms';
        var id = req.session.uId;
        var match = {};
        var matchKey = 'roleAccess.' + type + '.read';

        match[matchKey] = true;

        Personnel.findById(id, function (err, _personnel) {
            if (_personnel) {
                Roles.aggregate([
                    {
                        $project: {
                            roleAccess: 1
                        }
                    }, {
                        $match: {
                            _id: _personnel.accessRole
                        }
                    }, {
                        $unwind: '$roleAccess'
                    }, {
                        $match: match
                    }, {
                        $group: {
                            _id: '$roleAccess.module'
                        }
                    }],
                    function (err, result) {
                        if (err) {
                            return next(err);
                        }

                        Module.find({
                            _id    : {$in: result},
                            visible: true
                        }).sort({sequence: 1}).exec(function (err, modules) {
                            if (err) {
                                return next(err);
                            }
                            modules = _.groupBy(modules, 'parrent');
                            res.status(200).send(modules);
                        });
                    }
                );
            } else {
                res.status(403).send();
            }
        });
    };
};

module.exports = Module;