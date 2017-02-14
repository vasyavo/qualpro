define([
    'backbone',
    'helpers/contentTypesHelper',
    'helpers/breadcrumbsNavigator',
    'views/breadcrumb/breadcrumbs',
    'constants/contentType'],
function (Backbone, contentTypes, BreadcrumbsNavigator, BreadcrumbsView, CONTENT_TYPES) {
    var types = [
        CONTENT_TYPES.COUNTRY,
        CONTENT_TYPES.REGION,
        CONTENT_TYPES.SUBREGION,
        CONTENT_TYPES.RETAILSEGMENT,
        CONTENT_TYPES.OUTLET,
        CONTENT_TYPES.BRANCH
    ];

    var createLogicForDomainView = function (view) {

        var initializeView = function (options) {
            var contentType;

            Object.defineProperty(view, 'contentType', {
                enumerable: true,
                get       : function () {
                    return contentType;
                },
                set       : function (value) {
                    contentType = value;
                    this.childContent = contentTypes.getNextType(value);
                    this.creationType = contentTypes.getCreationType(value);
                }
            });

            view.collection = options.collection;
            view.defaultItemsNumber = view.collection.pageSize;
            view.listLength = view.collection.totalRecords;
            view.page = options.collection.page;
            view.breadcrumb = options.breadcrumb;
            view.parentId = options.parentId;
            view.contentType = options.collection.contentType;
        };

        var createNewItem = function (translation) {
            var contentType = view.creationType;
            var parentId = view.parentId;
            var modelUrl = 'models/' + contentType;
            var CreateView = view.CreateView;
            var ids = view.breadcrumb.ids;
            var currentTranslation = contentType === 'branch' ? translation.branch || translation : translation;

            require([modelUrl], function (Model) {
                var createView = new CreateView({
                    Model          : Model,
                    contentType    : contentType,
                    parentId       : parentId,
                    retailSegmentId: ids.retailSegment,
                    outletId       : ids.outlet,
                    subRegionId    : ids.subRegion,
                    translation    : currentTranslation
                });
                createView.on('modelSaved', function (model) {
                    var modelJSON = model.toJSON();

                    if (view.contentType === view.creationType) {
                        view.addReplaceRow(model);
                    } else {
                        require(['models/' + view.contentType], function (Model) {
                            var id = view.contentType === contentTypes.outlet ? modelJSON.outlet._id : modelJSON.retailSegment._id;
                            var newModel = new Model({_id: id});

                            newModel.fetch({
                                success: function (model) {
                                    view.addReplaceRow(model);
                                },
                                error  : function (model, response, options) {
                                    //todo display error
                                }
                            });
                        });
                    }
                });
            });
        };

        var createBreadcrumbs = function () {
            view.breadcrumbs = new BreadcrumbsView({
                contentType: view.contentType,
                contentView: view,
                breadcrumb : view.breadcrumb
            });
            view.breadcrumbs.bind('initialized', function (breadcrumbs) {
                view.breadcrumbsNavigator = new BreadcrumbsNavigator({
                    viewType   : view.viewType,
                    breadcrumbs: breadcrumbs
                });
            });
            view.breadcrumbs.bind('loadParentContent', function (data) {
                view.childContentLoader(data.type, data.parentId, data.parentName, data.parentArchived);
            });
            view.breadcrumbs.render();
        };

        var loadChildContent = function (childContentType, parentId, parentName, parentTabName) {
            var parentArchived = parentTabName === 'archived';
            var navigationOptions = view.breadcrumbsNavigator.goInside(parentId, parentTabName);
            var url = navigationOptions.windowUrl;
            var collectionUrl = navigationOptions.collectionUrl;
            var header = $('#header');
            var filterOpt = view.filter ? (navigationOptions.filter
                ? _.extend(view.filter, navigationOptions.filter)
                : view.filter)
                : navigationOptions.filter;

            var types = contentTypes.getAllBefore(childContentType);
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
            var translationUrl = "translations/" + currentLanguage + "/" + navigationOptions.contentType;

            view.breadcrumb.ids = {};
            types.forEach(function (type) {
                view.breadcrumb.ids[type] = view.breadcrumbsNavigator.types[type];
            });

            view.contentType = navigationOptions.contentType;

            delete filterOpt.globalSearch;

            require([collectionUrl, translationUrl], function (ContentCollection, translation) {
                var creationOptions = {
                    viewType     : view.viewType,
                    //page         : 1,
                    filter       : filterOpt,
                    newCollection: false,
                    contentType  : view.contentType,
                    breadcrumbs  : true
                };

                var collection;
                // var filter;

                if (parentId) {
                    creationOptions.parentId = parentId;
                }

                // filter = window.location.href.split('/filter=')[1];
                view.filterView.clearMethod(null, true);

                collection = new ContentCollection(creationOptions);
                collection.bind('reset', function () {
                    collection.unbind('reset');

                    view.collection = collection;
                    view.defaultItemsNumber = view.collection.pageSize;
                    view.listLength = view.collection.totalRecords;
                    view.page = view.collection.page;
                    view.parentId = parentId;

                    view.showMoreContent(collection);
                    header.text(view.contentType === 'country' ? 'Country' : '');

                    // view.breadcrumbs.add(parentName, parentId, view.contentType, parentArchived);
                    // view.breadcrumbs.add(parentName, parentId, contentTypes.getNextType(view.contentType), parentArchived);
                    view.breadcrumbs.add(parentName, parentId, contentTypes.getPreviousType(view.contentType), parentArchived);
                    view.trigger('contentTypeChanged', childContentType, collection, translation);
                });

                url += encodeURIComponent(JSON.stringify(view.filter));

                // url = view.filter && view.filter.archived ? url + '/filter[archived][type]=boolean&filter[archived][values][]=' + view.filter.archived.values[0] : url;
                Backbone.history.navigate(url, {replace: true, trigger: false});
            });
        };

        return {
            initializeView   : initializeView,
            createNewItem    : createNewItem,
            loadChildContent : loadChildContent,
            createBreadcrumbs: createBreadcrumbs
        };
    };

    contentTypes.setContentTypes(types);

    return createLogicForDomainView;
});
