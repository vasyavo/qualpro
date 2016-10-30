var _ = require('lodash');

var Module = function (db) {
    this.getAll = function (req, res, next) {
        var ModuleModel = require('./../types/module/model');
        var AccessRoleModel = require('./../types/accessRole/model');
        var PersonnelModel = require('./../types/personnel/model');
        var isMobile = !!req.isMobile;
        var type = isMobile ? 'mobile' : 'cms';
        var id = req.session.uId;
        var match = {};
        var matchKey = 'roleAccess.' + type + '.read';

        match[matchKey] = true;

        PersonnelModel.findById(id, function (err, _personnel) {
            if (_personnel) {
                AccessRoleModel.aggregate([
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

                        ModuleModel.find({
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