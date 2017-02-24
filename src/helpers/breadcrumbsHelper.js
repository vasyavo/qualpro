var mongoose = require('mongoose');
var async = require('async');

var BreadcrumbsHelper = function () {

    //region variables

    const OutletModel = require('./../types/outlet/model');
    const RetailSegmentModel = require('./../types/retailSegment/model');
    const DomainModel = require('./../types/domain/model');

    //endregion

    //region functions

    var getBreadcrumbsByFakeDomains = function (options, callback) {
        var subRegion = options.subRegionId.split(',')[0] || '';
        var outlet;
        var retailSegment;

        var parallelTasks = {
            subRegion: DomainModel.findById.bind(DomainModel, subRegion)
        };

        if (options.outletId) {
            outlet = options.outletId.split(',')[0] || '';
            parallelTasks.outlet = OutletModel.findById.bind(OutletModel, outlet);
        }

        if (options.retailSegmentId) {
            retailSegment = options.retailSegmentId.split(',')[0] || '';
            parallelTasks.retailSegment = RetailSegmentModel.findById.bind(RetailSegmentModel, retailSegment);
        }

        async.parallel(parallelTasks, function (err, response) {
            var breadcrumbs;
            var subRegion;
            var error;

            if (err) {
                callback(err);
            }

            subRegion = response.subRegion;

            if (!subRegion) {
                error = new Error('breadcrumbsHelper: subRegion not found');
                error.status = 404;

                return callback(error);
            }

            breadcrumbs = {subRegion: {name: subRegion.name, id: subRegion._id, archived: subRegion.archived}};
            breadcrumbs.outlet = response.outlet ? {name: response.outlet.name, id: response.outlet._id, archived: response.outlet.archived} : null;
            breadcrumbs.retailSegment = response.retailSegment ? {
                name: response.retailSegment.name,
                id  : response.retailSegment._id,
                archived: response.retailSegment.archived
            } : null;

            getBreadcrumbsForSubRegion({regionId: subRegion.parent, breadcrumbs: breadcrumbs}, callback);
        });
    };

    var getBreadcrumbsForSubRegion = function (options, callback) {
        var regionId = options.regionId;
        var breadcrumbs = options.breadcrumbs || {};

        if (typeof regionId === 'string') {
            regionId = regionId.split(',')[0] || '';
        }

        DomainModel.findById(regionId, function (err, model) {
            var region;
            var countryId;
            var error;

            if (err) {
                return callback(err);
            }

            region = model;

            if (!region) {
                error = new Error('breadcrumbsHelper: region not found');
                error.status = 404;

                return callback(error);
            }

            countryId = region.parent;

            breadcrumbs.region = {name: region.name, id: region._id, archived: region.archived};

            getBreadcrumbsForRegion({countryId: countryId, breadcrumbs: breadcrumbs}, callback);
        });

    };

    var getBreadcrumbsForRegion = function (options, callback) {
        var countryId = options.countryId;
        var breadcrumbs = options.breadcrumbs || {};

        if (typeof countryId === 'string') {
            countryId = countryId.split(',')[0] || '';
        }

        DomainModel.findById(countryId, function (err, model) {
            var country;

            if (err) {
                return callback(err);
            }

            country = model;

            if (!country) {
                error = new Error('breadcrumbsHelper: country not found');
                error.status = 404;

                return callback(error);
            }

            breadcrumbs.country = {name: country.name, id: country._id, archived: country.archived};

            callback(null, breadcrumbs);
        });
    };

    //endregion

    this.getBreadcrumbs = function (options, callback) {
        var type = options.type;
        var ids = options.ids;
        var searchOptions = {};

        switch (type) {
            case 'branch':
                searchOptions.outletId = ids.outlet;
            case 'outlet':
                searchOptions.retailSegmentId = ids.retailSegment;
            case 'retailSegment':
                searchOptions.subRegionId = ids.subRegion;
                getBreadcrumbsByFakeDomains(searchOptions, callback);
                break;
            case 'subRegion':
                searchOptions.regionId = ids.parent;
                getBreadcrumbsForSubRegion(searchOptions, callback);
                break;
            case 'region':
                searchOptions.countryId = ids.parent;
                getBreadcrumbsForRegion(searchOptions, callback);
                break;
            default:
                callback(null, {breadcrumbs: {}});
        }
    };
};

module.exports = BreadcrumbsHelper;