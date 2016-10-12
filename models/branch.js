module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    /**
     * @constructor BranchModel
     * @type {*|Schema}
     *
     * @property {Object} name
     * @property {String} name.en
     * @property {String} name.ar
     * @property {String} imageSrc ___base64___ representation of avatar
     * @property {Bool} archived is domain archived
     * @property {String} manager ___reference___ to {@link PersonnelModel}
     * @property {Object} address
     * @property {String} address.en
     * @property {String} address.ar
     * @property {String} linkToMap _link to map_
     * @property {String} subRegion ___reference___ to {@link CountryModel}
     * @property {String} retailSegment ___reference___ to {@link RetailSegmentModel}
     * @property {String} outlet ___reference___ to {@link OutletModel}
     * @property {Object} createdBy
     * @property {String} createdBy.user ___reference___ to {@link PersonnelModel}
     * @property {Date} createdBy.date
     * @property {Object} editedBy
     * @property {String} editedBy.user ___reference___ to {@link PersonnelModel}
     * @property {Date} editedBy.date
     */

    var schema = new mongoose.Schema({
        name    : {
            en: {type: String},
            ar: {type: String}
        },
        ID      : String,
        imageSrc: {
            type   : String,
            default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAABAAAAAQADq8/hgAAAEaElEQVRYw82X6XLbNhCA+f4PVomk5MRyHDtp63oEgDcl3vfRBQhQIEVKSvsnO+OxRBEfFnthV+n/pyi/NaCryzzL8rJu/wOgzQPXJBgjhDExnXPW/Aqgy30DI0yIwYQQ4Bhe2j0I6BIbI1jL9meC2TdkRu0jgMxCGN5H2HT8IIzjKPAdE9NngEjuAhqfv3rOpe3aIrDAFoB1qtuA3ADlMXKuz9vlLqZokt4CxPAOQXa2bPDCRVSJYB0QIDA4ibp+TVKDbuCvAeh6YpX9DWkcUGJCkAARXW9UfXeL0PmUcF4CZBA4cALv5nqQM+yD4mtATQMOGMi9RzghiKriCuBiAzsB1e8uwUUGtroZIAEsqfqHCI2JjdGZHNDSZzHYb0boQK4JOTVXNQFEoJXDPskEvrYTrJHgIwOdZEBrggXzfkbo+sY7Hp0Fx9bUYbUEAAtgV/waHAcCnOew3arbLy5lVXGSXIrKGQkrKKMLcnHsPjEGAla1PYi+/YCV37e7DRp1qUDjwREK1wjbo56hezRoPLxt9lzUg+m96Hvtz3BMcU9syQAxKBSJ/c2Nqv0Em5C/97q+BdGoEuoORN98CkAqzsAAPh690vdv2tOOEcx/dodP0zq+qjpoQQF7/Vno2UA0OgLQQbUZI6t/1+BlRgAlyywvqtNXja0HFQ7jGVwoUA0HUBNcMvRdpW8PpzDPYRAERfmNE/TDuE8Ajis4oJAiUwB2+g+am3YEEmT5kz4HgOdRygHUIPEMsFf/YvXJYoSKbPczQI4HwysSbKKBdk4dLAhJsptrUHK1lSERUDYD6E9pGLsjoXzRZgAIJVaYBCCfA57zMBoJYfV9CXDigHhRgww2Hgngh4UjnCUbJAs2CEdCkl25kbou5ABh0KkXPupA6IB8fOUF4TpFOs5Eg50eFSOBfOz0GYCWoJwDoJzwcjQBfM2rMAjD0CEsL/Qp4ISG/FHkuJ4A9toXv66KomosMMNAuAA6GxOWPwqP64sb3kTm7HX1Fbsued9BXjACZKNIphLz/FF4WIps6vqff+jaIFAONiBbTf1hDITti5RLg+cYoDOxqJFwxb0dXmT5Bn/Pn8wOh9dQnMASK4aaSGuk+G24DObCbm5XzkXs9RdASTuytUZO6Czdm2BCA2cSgNbIWedxk0AV4FVYEYFJpLK4SuA3DrsceQEQl6svXy33CKfxIrwAanqZBA8R4AAQWeUMwJ6CZ7t7BIh6utfos0uLwxqP7BECMaTUuQCoawhO+9sSUWtjs1kA9I1Fm8DoNiCl64nUCsp9Ym1SgncjoLoz7YTl9dNOtbGRYSAjWbMDNPKw3py0otNeufVYN2wvzha5g6iGzlTDebsfEdbtW9EsLOvYZs06Dmbsq4GjcoeBgThBWtRN2zZ1mYUuGZ7axfz9hZEns+mMQ+ckzIYm/gn+WQvWWRq6uoxuSNi4RWWAYGfRuCtjXx25Bh25MGaTFzaccCVX1wfPtkiCk+e6nh/ExXps/N6z80PyL8wPTYgPwzDiAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDExLTAxLTE5VDAzOjU5OjAwKzAxOjAwaFry6QAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMC0xMi0yMVQxNDozMDo0NCswMTowMGxOe/8AAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC'
        },

        archived   : {type: Boolean, default: false},
        topArchived: {type: Boolean, default: false},
        manager    : {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
        address    : {
            en: String,
            ar: String
        },

        linkToMap    : {type: String, default: ''},
        subRegion    : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN, required: true},
        retailSegment: {type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT, required: true},
        outlet       : {type: ObjectId, ref: CONTENT_TYPES.OUTLET, required: true},

        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: 'branches'});

    schema.pre('save', updateArraysInRetSegmentAndOutlet);

    schema.index({name: 1, outlet: 1, retailSegment: 1, subRegion: 1}, {unique: true});

    function updateArraysInRetSegmentAndOutlet(next) {
        //todo check if it fires on update. If yes, check next properties

        var outletId = this.outlet;
        var retailSegmentId = this.retailSegment;
        var subRegionId = this.subRegion;
        var models = this.db.models;
        var RetailSegment = models.retailSegment;
        var Outlet = models.outlet;

        RetailSegment.findByIdAndUpdate(retailSegmentId, {
            $addToSet: {subRegions: subRegionId}
        }, function (err, model) {
            if (err) {
                return next(err);
            }

            Outlet.findByIdAndUpdate(outletId, {
                $addToSet: {subRegions: subRegionId, retailSegments: retailSegmentId}
            }, function (err) {
                if (err) {
                    return next(err);
                }

                next();
            });
        });
    }

    mongoose.model(CONTENT_TYPES.BRANCH, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.BRANCH] = schema;
})();