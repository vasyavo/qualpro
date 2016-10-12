define([
    'helpers/breadcrumb',
    'helpers/contentTypesHelper',
    'constants/contentType'
], function (Breadcrumb, contentTypes, CONTENT_TYPES) {
    var types = [
        CONTENT_TYPES.COUNTRY,
        CONTENT_TYPES.REGION,
        CONTENT_TYPES.SUBREGION,
        CONTENT_TYPES.RETAILSEGMENT,
        CONTENT_TYPES.OUTLET,
        CONTENT_TYPES.BRANCH
    ];

    var BreadcrumbsNavigator = function (options) {
        var presentTypes = [];
        var breadcrumb;

        this.viewType = options.viewType;
        this.types = {};

        for (var name in options.breadcrumbs) {
            breadcrumb = options.breadcrumbs[name];

            if (breadcrumb) {
                this.types[breadcrumb.type] = breadcrumb.id;
                presentTypes.push(breadcrumb.type);
            }
        }

        this.contentType = presentTypes.length ? contentTypes.getNextAfterAll(presentTypes) : contentTypes.first();
    };

    BreadcrumbsNavigator.prototype.getContentTypeBy = function (id) {
        var types = this.types;

        for (var type in types) {
            if (types[type] === id) {
                return type;
            }
        }

        return null;
    };

    BreadcrumbsNavigator.prototype.goInside = function (parentId, parentTabName) {
        var parentArchived = parentTabName === 'archived';
        var contentType = this.getContentTypeBy(parentId);
        var nextType = contentTypes.getNextType(contentType ? (this.contentType = contentType) : this.contentType);
        var result = {};

        this.types[this.contentType] = parentId;

        result.windowUrl = '#qualPro/domain/' + nextType + '/' + parentTabName + '/' + this.viewType;
        result.collectionUrl = nextType ? 'collections/' + nextType + '/collection' : null;

        switch (nextType) {
            case contentTypes.country:
            case contentTypes.region:
            case contentTypes.subRegion:
                result.filter = {"parent": {values: [parentId], type: "ObjectId"}};
                result.windowUrl += (parentId ? ('/pId=' + parentId + ',' + parentArchived) : '');
                break;
            case contentTypes.retailSegment:
                result.filter = {"subRegions": {values: [parentId], type: "ObjectId"}};
                result.windowUrl += '/sId=' + parentId + ',' + parentArchived;
                break;
            case contentTypes.outlet:
                result.filter = {
                    "subRegions"    : {values: [this.types[contentTypes.subRegion]], type: "ObjectId"},
                    "retailSegments": {values: [parentId], type: "ObjectId"}
                };
                result.windowUrl += '/sId=' + this.types[contentTypes.subRegion] + '/rId=' + parentId + ',' + parentArchived;
                break;
            case contentTypes.branch:
                result.filter = {
                    "subRegion"    : {values: [this.types[contentTypes.subRegion]], type: "ObjectId"},
                    "retailSegment": {values: [this.types[contentTypes.retailSegment]], type: "ObjectId"},
                    "outlet"       : {values: [parentId], type: "ObjectId"}
                };
                result.windowUrl += '/sId=' + this.types[contentTypes.subRegion] + '/rId=' + this.types[contentTypes.retailSegment] + '/oId=' + parentId + ',' + parentArchived;
                break;
        }
        result.contentType = nextType;
        this.contentType = nextType;
        return result;
    };

    contentTypes.setContentTypes(types);

    return BreadcrumbsNavigator;
});