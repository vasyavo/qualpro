var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('Underscore');
var lodash = require('lodash');
var moment = require('moment');
var Cookies = require('js-cookie');
var mainView = require('./views/main/main');
var LoginView = require('./views/login/login');
var CreateSuperAdminView = require('./views/createSuperAdmin/createSuperAdmin');
var forgotPassView = require('./views/forgotPassword/forgotPassword');
var dataService = require('./dataService');
var custom = require('./custom');
var CONSTANTS = require('./constants/contentType');
var DocumentsListView = require('./views/documents/list');
var DocumentsTopBarView = require('./views/documents/topBar');
var ImportExportOverview = require('./views/importExport/Overview');
var ImportExportTopBarView = require('./views/importExport/TopBar');
var ImportExportModel = require('./models/importExport');
var ACL_ROLES = require('./constants/aclRoleIndexes');
var PubNubClient = require('./services/pubnub');
var App = require('./appState');
var DocumentCollection = require('./collections/documents/collection');
var DefFilters = require('./helpers/defFilterLogic');

module.exports = Backbone.Router.extend({

    wrapperView: null,
    mainView   : null,
    topBarView : null,
    view       : null,

    routes: {
        home : 'any',
        'login(/:confirmed)' : 'login',
        'logout' : 'logout',
        forgotPass : 'forgotPass',
        'qualPro/documents(/filter=:filter)' : 'documentsHomePage',
        'qualPro/documents/:id(/filter=:filter)' : 'showDocumentsView',
        'qualPro/importExport' : 'goToImportExportView',
        'qualPro/domain/:domainType/:tabName/:viewType(/pId=:parentId)(/sId=:subRegionId)(/rId=:retailSegmentId)(/oId=:outletId)(/p=:page)(/c=:countPerPage)(/filter=:filter)': 'goToDomains',
        'qualPro/domain/:domainType(/:tabName)(/:viewType)(/p=:page)(/c=:countPerPage)(/filter=:filter)' : 'getDomainList',
        // 'qualPro/:contentType(/p=:page)(/c=:countPerPage)(/filter=:filter)' : 'getList',
        'qualPro/:contentType(/:tabName)(/:viewType)(/pId=:parentId)(/p=:page)(/c=:countPerPage)(/filter=:filter)' : 'goToContent',
        'qualPro/:contentType/form/:contentId' : 'goToForm',
        '*any' : 'any'
    },

    initialize: function () {
        App.$preLoader = $('#loader');
        this.on('all', function () {
            $('.ui-dialog').remove();
            $('#ui-datepicker-div').hide().remove();
        });

        $(document).on('click', function () {
            $('#paginationHolder .pagesPopup').hide();
            $('.dropDownInputWrap').removeClass('openDdReverse');
            $('.dropDownInputWrap').removeClass('openDd');
        });

        custom.applyDefaults();
    },

    logout: function () {
        var self = this;

        $.get('/logout', function () {
            var userId = App.currentUser._id;

            PubNubClient.unsubscribe({
                userId: userId
            });

            App.socket.emit('logout');
            delete App.currentUser;
            self.changeStyle('en');
            Backbone.history.navigate('/login', {trigger: true});
        });
    },

    documentsHomePage : function (filter) {
        this.showDocumentsView(null, filter);
    },

    showDocumentsView : function (folder, filter) {
        var that = this;

        this.checkLogin(function (success) {
            if (!success) {
                return that.redirectTo();
            }

            if (that.view) {
                that.view.undelegateEvents();
            }

            if (that.wrapperView) {
                that.wrapperView.undelegateEvents();
            }

            if (!that.wrapperView) {
                that.main('documents');
            }

            var $loader = $('#alaliLogo');
            if (!$loader.hasClass('smallLogo')) {
                $loader.addClass('animated');
                $loader.addClass('smallLogo').removeClass('ellipseAnimated');
            }

            var currentLanguage = App.currentUser.currentLanguage;
            var translation = require('./translations/' + currentLanguage + '/documents');
            var rootPath = CONSTANTS.DOCUMENTS + '/folder';
            var documentsCollection = new DocumentCollection();

            delete documentsCollection.state.search;

            if (folder) {
                documentsCollection.url = rootPath + '/' + folder;
                documentsCollection.folder = folder;
            } else {
                documentsCollection.url = rootPath;
                documentsCollection.folder = null;
            }

            if (filter) {
                filter = JSON.parse(filter);
                documentsCollection.url = documentsCollection.url + '?' + $.param(filter);
            }

            var documentsTopBarView = new DocumentsTopBarView({
                translation : translation,
                collection : documentsCollection,
                archived : lodash.get(filter, 'archived')
            });
            $('#topBarHolder').html(documentsTopBarView.render().$el);

            var documentsListView = new DocumentsListView({
                collection : documentsCollection,
                translation : translation
            });

            $('#contentHolder').html(documentsListView.render().$el);

            documentsCollection.getFirstPage();
        });
    },

    goToImportExportView: function () {
        var that = this;

        this.checkLogin(function (success) {
            if (!success) {
                return that.redirectTo();
            }

            var currentUserAccessRole = App.currentUser.accessRole.level;
            if (![ACL_ROLES.MASTER_ADMIN, ACL_ROLES.MASTER_UPLOADER, ACL_ROLES.COUNTRY_UPLOADER].includes(currentUserAccessRole)) {
                return Backbone.history.navigate('qualPro', true);
            }

            if (that.view) {
                that.view.undelegateEvents();
            }

            if (that.wrapperView) {
                that.wrapperView.undelegateEvents();
            }

            if (!that.wrapperView) {
                that.main('importExport');
            }

            var $loader = $('#alaliLogo');
            if (!$loader.hasClass('smallLogo')) {
                $loader.addClass('animated');
                $loader.addClass('smallLogo').removeClass('ellipseAnimated');
            }

            var translation = require('./translations/' + App.currentUser.currentLanguage + '/importExport');
            var importExportModel = new ImportExportModel();

            var importExportTopBar = new ImportExportTopBarView({
                model: importExportModel,
                translation: translation,
            });
            $('#topBarHolder').html(importExportTopBar.render().$el);

            var importExportOverview = new ImportExportOverview({
                model: importExportModel,
                translation: translation,
            });
            $('#contentHolder').html(importExportOverview.render().$el);
        });
    },

    redirectTo: function () {
        if (App.requestedURL === null) {
            App.requestedURL = Backbone.history.fragment;
        }

        Backbone.history.fragment = '';
        Backbone.history.navigate('login', {trigger: true});
    },

    changeWrapperView: function (wrapperView) {
        if (this.wrapperView) {
            this.wrapperView.undelegateEvents();
        }
        this.wrapperView = wrapperView;
    },

    changeView: function (view) {
        if (this.view) {
            this.view.undelegateEvents();
        }

        $(document).trigger('resize');

        this.view = view;
    },

    main: function (contentType) {
        this.mainView = new mainView({contentType: contentType});
        this.changeWrapperView(this.mainView);
    },

    testContent: function (contentType) {
        if (!CONSTANTS[contentType.toUpperCase()]) {
            contentType = CONSTANTS.PERSONNEL;
        }

        return contentType;
    },

    goToDomains: function (domainType, tabName, viewType, parentId, subRegionId, retailSegmentId, outletId, page, countPerPage, filter) {
        var self = this;

        App.$preLoader.fadeFn({
            visibleState: true
        });

        this.checkLogin(function (success) {
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';

            if (!success) {
                return self.redirectTo();
            }

            if (self.mainView === null) {
                self.main(domainType);
            }

            var contentViewUrl = 'views/domain/' + viewType;
            var topBarViewUrl = 'views/domain/topBarView';
            var startTime = new Date();
            var collectionUrl = 'collections/' + domainType + '/collection';
            var translationUrl = 'translations/' + currentLanguage + '/' + domainType;
            var breadcrumb = {
                type: domainType,
                ids : {
                    parent       : parentId,
                    subRegion    : subRegionId,
                    retailSegment: retailSegmentId,
                    outlet       : outletId
                }
            };

            self.mainView.topMenu.currentCT = domainType;

            function loadContent() {
                var $loader = $('#alaliLogo');

                if (!$loader.hasClass('smallLogo')) {
                    $loader
                        .addClass('animated');

                    setTimeout(function () {
                        $loader
                            .addClass('smallLogo')
                            .removeClass('ellipseAnimated');

                        getContentDomain();
                    }, 1000);
                } else {
                    getContentDomain();
                }
            }

            loadContent();

            function getContentDomain() {
                var ContentView = require(contentViewUrl);
                var TopBar = require(topBarViewUrl);
                var Collection = require(collectionUrl);
                var translation = require(translationUrl);
                var defaultFilters = new DefFilters(App.currentUser._id);
                var defCurFilter = defaultFilters.getDefFilter(domainType, tabName);
                filter = filter ? JSON.parse(decodeURIComponent(filter)) : defCurFilter;
                var domainFilter = composeDomainFilter(domainType, parentId, subRegionId, retailSegmentId, outletId);
                filter = _.extend(filter, domainFilter);

                var contentViewOpts = {
                    Constructor: ContentView,
                    options    : {
                        startTime  : startTime,
                        filter     : filter,
                        breadcrumb : breadcrumb,
                        tabName    : tabName,
                        defFilter  : defCurFilter,
                        contentType: domainType,
                        translation: translation
                    }
                };
                var collectionOpts = {
                    Constructor: Collection,
                    options    : {
                        viewType     : viewType,
                        filter       : filter,
                        newCollection: true
                    }
                };
                var topBarOpts = {
                    Constructor: TopBar,
                    options    : {
                        viewType   : viewType,
                        filter     : filter,
                        contentType: domainType,
                        tabName    : tabName,
                        translation: translation
                    }
                };

                if (self.mainView === null) {
                    self.main(domainType);
                }

                self.createViews(contentViewOpts, topBarOpts, collectionOpts, self.mainView.topMenu);
            }
        });
    },

    getContent: function (options) {
        var context = options.context;
        var contentType = options.contentType;
        var viewType = options.viewType || 'list';
        var tabName = options.tabName || 'all';
        var countPerPage = options.countPerPage;
        var page = options.page || 1;
        var filter = options.filter;

        var self = context;
        var startTime = new Date();
        var contentViewUrl = 'views/' + contentType + '/' + viewType + '/' + viewType + 'View';
        var topBarViewUrl = 'views/' + contentType + '/topBarView';
        var collectionUrl = 'collections/' + contentType + '/collection';
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
        var translationUrl = 'translations/' + currentLanguage + '/' + contentType;

        if (context.mainView === null) {
            context.main(contentType);
        }

        function loadContent() {
            var ContentView = require(contentViewUrl);
            var TopBarView = require(topBarViewUrl);
            var ContentCollection = require(collectionUrl);
            var translation = require(translationUrl);
            var defaultFilters = new DefFilters(App.currentUser._id);
            var defCurFilter = defaultFilters.getDefFilter(contentType, tabName);
            filter = filter ? JSON.parse(decodeURIComponent(filter)) : defCurFilter;

            var contentViewOpts = {
                Constructor: ContentView,
                options    : {
                    el         : '#contentHolder',
                    startTime  : startTime,
                    filter     : filter,
                    tabName    : tabName,
                    defFilter  : defCurFilter,
                    contentType: contentType,
                    translation: translation
                }
            };
            var collectionOpts = {
                Constructor: ContentCollection,
                options    : {
                    viewType     : viewType,
                    page         : page,
                    count        : countPerPage,
                    filter       : filter,
                    contentType  : contentType,
                    newCollection: true
                }
            };
            var topBarOpts = {
                Constructor: TopBarView,
                options    : {
                    viewType   : viewType,
                    filter     : filter,
                    contentType: contentType,
                    tabName    : tabName,
                    translation: translation
                }
            };

            self.createViews(contentViewOpts, topBarOpts, collectionOpts, context.mainView.topMenu);
        }

        loadContent();
    },

    selectMenu: function (href) {
        var self = this;

        if (!this.mainView || !this.mainView.leftMenu) {
            return setTimeout(function () {
                self.selectMenu(null, href);
            }, 500);
        }

        this.mainView.leftMenu.selectMenu(null, href);
    },

    createViews: function (viewOpts, topBarOpts, collectionOpts, topMenu) {
        var self = this;
        var ContentView = viewOpts.Constructor;
        var viewOptions = viewOpts.options || {};
        var TopBarView = topBarOpts.Constructor;
        var topBarOptions = topBarOpts.options || {};
        var Collection = collectionOpts.Constructor;
        var collectionOptions = collectionOpts.options;
        var collection = new Collection(collectionOptions);

        this.mainView.topMenu.trigger('changeStyle');

        viewOptions.collection = collection;

        collection.bind('reset', _.bind(function () {
            var topbarView;
            var contentView;

            collection.unbind('reset');

            topbarView = new TopBarView(topBarOptions);
            contentView = new ContentView(viewOptions);

            contentView.render();

            self.changeView(contentView);
            self.changeTopBarView(topbarView);

            subscribeTopBarEvents(self.topBarView, self.view);
            subscribeContentViewEvents(self.view, self.topBarView, topMenu);
            subscribeCollectionEvents(collection, self.view, self.topBarView);

            collection.trigger('renderFinished', {
                length     : collection.totalRecords,
                currentPage: collection.currentPage,
                itemsNumber: collection.pageSize
            });

            self.mainView.off();

            self.mainView.on('languageChanged', function () {
                var curContentView = self.view;
                var filterView = curContentView.filterView;

                curContentView.filter = _.extend(curContentView.defFilter, curContentView.filter);
                curContentView.trigger('filter');
                if (filterView) {
                    filterView.changeLanguage();
                }
            });

            self.mainView.on('translationLoaded', function (translation) {
                self.view.changeTranslatedFields(translation);
                self.topBarView.changeTranslatedFields(translation);
            });
            self.selectMenu('#qualPro/' + topBarOptions.contentType);
        }, self));
        App.storage.remove('currentCheckedFilter');
    },

    getDomainList: function (contentType, tabName, viewType, page, countPerPage, filter) {
        var viewTypes = ['list', 'thumbnails'];

        this.contentType = contentType;

        contentType = this.testContent(contentType);

        if (!tabName || (viewTypes.indexOf(tabName) !== -1)) {
            tabName = custom.getCurrentTab(contentType);
        }

        if (!viewType || (viewTypes.indexOf(viewTypes) === -1)) {
            viewType = custom.getCurrentVT({contentType: contentType});
            if (viewType) {
                App.requestedURL = '#qualPro/domain/' + contentType + '/' + tabName + '/' + viewType;
                Backbone.history.navigate(App.requestedURL, {trigger: true});
            } else {
                this.goToDomains(contentType, null, null, null, null, null, page, countPerPage, filter);
            }
        }
    },

    goToContent: function (contentType, tabName, viewType, parentId, page, countPerPage, filter) {
        App.$preLoader.fadeFn({
            visibleState: true
        });
        var self = this;

        this.checkLogin(function (success) {
            var viewTypes = ['list', 'thumbnails'];
            var $loader = $('#alaliLogo');

            if (!success) {
                return self.redirectTo();
            }

            if (App && App.filterCollections) {
                delete App.filterCollections[contentType];
            }

            if (tabName && tabName.indexOf('filter=') > -1) {
                filter = tabName.replace('filter=', '');
                tabName = null;

                self.selectMenu('#qualPro/' + contentType);

                // self.mainView.leftMenu.selectMenu(null, '#qualPro/' + contentType);
            }

            if (!tabName || (viewTypes.indexOf(tabName) !== -1)) {
                tabName = custom.getCurrentTab(contentType);
            }

            if (!viewType) {
                viewType = custom.getCurrentVT({contentType: contentType});
                if (viewType) {
                    App.requestedURL = '#qualPro/' + contentType + '/' + tabName + '/' + viewType;
                    Backbone.history.navigate(App.requestedURL, {trigger: false});
                }
            }

            if (self.mainView === null) {
                self.main(contentType);
            }

            self.mainView.topMenu.currentCT = contentType;

            if (!$loader.hasClass('smallLogo')) {
                $loader
                    .addClass('animated');

                setTimeout(function () {
                    $loader
                        .addClass('smallLogo')
                        .removeClass('ellipseAnimated');

                    self.getContent({
                        context     : self,
                        contentType : contentType,
                        page        : page,
                        countPerPage: countPerPage,
                        viewType    : viewType,
                        tabName     : tabName,
                        parentId    : parentId,
                        filter      : filter
                    });
                }, 1000);
            } else {
                self.getContent({
                    context     : self,
                    contentType : contentType,
                    page        : page,
                    countPerPage: countPerPage,
                    viewType    : viewType,
                    tabName     : tabName,
                    parentId    : parentId,
                    filter      : filter
                });
            }
        });
    },

    changeTopBarView: function (topBarView) {
        if (this.topBarView) {
            this.topBarView.undelegateEvents();
        }
        this.topBarView = topBarView;
    },

    any: function () {
        this.mainView = new mainView();
        this.changeWrapperView(this.mainView);
        this.goToContent('activityList');
    },

    login: function (confirmed) {
        var self = this;

        this.mainView = null;
        dataService.getData('/personnel/existSuperAdmin', {}, function (err, res) {
            var createSuperAdminView;
            var loginView;

            function runView() {
                if (res === 'exist') {
                    loginView = new LoginView();
                    self.changeWrapperView(loginView);
                } else {
                    createSuperAdminView = new CreateSuperAdminView();
                    self.changeWrapperView(createSuperAdminView);
                }
            }

            if (err) {
                return App.render(err);
            }

            if (confirmed) {
                $.get('/logout', function () {
                    delete App.currentUser;
                    App.requestedURL = null;
                    Backbone.history.navigate('/login', false);
                    runView();
                });
            } else {
                runView();
            }

        });
    },

    forgotPass: function () {
        this.mainView = null;
        this.changeWrapperView(new forgotPassView());
    }
});

// region Methods

/**
 * Subscribes next top bar events to specific methods of contentView setting context to context view:
 * createEvents -> createItem
 * editEvent -> editItem
 * disableEvent -> archiveItems
 * showFilteredContent -> showFilteredContent
 * firstPage -> firstPage
 * lastPage -> lastPage
 * nextPage -> nextPage
 * previousPage -> previousPage
 * getPage -> getPage
 * switchPageCounter -> switchPageCounter
 * @param topBarView
 * @param contentView
 */
var subscribeTopBarEvents = function (topBarView, contentView) {
    topBarView.bind('createEvent', contentView.createItem, contentView);
    topBarView.bind('editEvent', contentView.editItem, contentView);
    topBarView.bind('disableEvent', contentView.archiveItems, contentView);
    topBarView.bind('update-list-view', contentView.updateListView, contentView);

    topBarView.bind('sendPass', contentView.sendPass, contentView);
    topBarView.bind('addSupervisor', contentView.addSupervisor, contentView);

    topBarView.bind('showFilteredContent', contentView.showFilteredContent, contentView);

    topBarView.bind('nextPage', function (options) {
        App.$preLoader.fadeFn({
            visibleState: true,
            transparent : true
        });

        contentView.nextPage(options);
    }, contentView);
    topBarView.bind('previousPage',function(options){
        App.$preLoader.fadeFn({
            visibleState: true,
            transparent : true
        });
        contentView.previousPage(options);
    }, contentView);
    topBarView.bind('getPage', function(options){
        App.$preLoader.fadeFn({
            visibleState: true,
            transparent : true
        });

        contentView.getPage(options);
    }, contentView);
    topBarView.bind('switchPageCounter', function(options){
        App.$preLoader.fadeFn({
            visibleState: true,
            transparent : true
        });

        contentView.switchPageCounter(options);
    }, contentView);

    topBarView.bind('checkAll', contentView.checkAll, contentView);
    topBarView.bind('checkAvailableSendPass', contentView.checkAvailableSendPass, contentView);
};

/**
 * Subscribes next collection events to specific methods of contentView setting context to context view:
 * showMore -> showMoreContent
 * @param collection
 * @param contentView
 */
var subscribeCollectionEvents = function (collection, contentView, topBarView) {
    collection.bind('showMore', function (options) {
        App.$preLoader.fadeFn({
            visibleState: false
        });
        contentView.showMoreContent(options)
    }, contentView);
    collection.bind('add', contentView.addItem, contentView);
    collection.bind('remove', contentView.removeRow, contentView);
    collection.bind('renderFinished', topBarView.setPagination, topBarView);
};

/**
 * Subscribes next contentView events to specific methods of topBarView setting context to topBarView:
 * selectedElementsChanged -> changeActionButtonState
 * @param contentView
 * @param topBarView
 */
var subscribeContentViewEvents = function (contentView, topBarView, topMenu) {
    contentView.bind('renderCurrentUserInfo', topMenu.renderCurrentUserInfo, topMenu);
    contentView.bind('contentTypeChanged', topBarView.changeContentType, topBarView);
    contentView.bind('contentTypeChanged', function (newContentType, collection, translation) {
        topMenu.currentCT = newContentType;
        topMenu.collection = collection;
        contentView.translation = translation;
        contentView.contentType = newContentType;
        contentView.collection.unbind();
        contentView.correctView(newContentType);
        subscribeCollectionEvents(contentView.collection, contentView, topBarView);
    });

    contentView.bind('changeTabs', topBarView.changeTabs, topBarView);
    contentView.bind('hideCreateForBreadCrumbs', topBarView.hideCreateForBreadCrumbs, topBarView);

    contentView.bind('hideActionDd', topBarView.hideAction, topBarView);
    contentView.bind('unCheckSelectAll', topBarView.unCheckSelectAll, topBarView);
    contentView.bind('collapseActionDropDown', topBarView.collapseActionDropDown, topBarView);

    contentView.bind('filter', topBarView.showFilteredPage, topBarView);
    contentView.bind('selectedElementsChanged', topBarView.changeActionButtonState, topBarView);
    contentView.bind('changeActionButtons', topBarView.changeActionButtons, topBarView);

    contentView.bind('pagination', topBarView.setPagination, topBarView);
};

var composeDomainFilter = function (domainType, parentId, subRegionId, retailSegmentId, outletId) {
    if (parentId) {
        parentId = parentId.split(',')[0];
    }

    if (subRegionId) {
        subRegionId = subRegionId.split(',')[0];
    }

    if (retailSegmentId) {
        retailSegmentId = retailSegmentId.split(',')[0];
    }

    if (outletId) {
        outletId = outletId.split(',')[0];
    }

    switch (domainType) {
        case CONSTANTS.COUNTRY:
            return {};
        case CONSTANTS.REGION:
        case CONSTANTS.SUBREGION:
            if (parentId) {
                return {parent: {values: [parentId], type: 'ObjectId'}};
            }
            return {};
        case CONSTANTS.RETAILSEGMENT:
            if (subRegionId) {
                return {subRegions: {values: [subRegionId], type: 'ObjectId'}};
            }
            return {};
        case CONSTANTS.OUTLET:
            if (subRegionId && retailSegmentId) {
                return {
                    subRegions    : {values: [subRegionId], type: 'ObjectId'},
                    retailSegments: {values: [retailSegmentId], type: 'ObjectId'}
                };
            }
            return {};
        case CONSTANTS.BRANCH:
            if (subRegionId && retailSegmentId && outletId) {
                return {
                    subRegion    : {values: [subRegionId], type: 'ObjectId'},
                    retailSegment: {values: [retailSegmentId], type: 'ObjectId'},
                    outlet       : {values: [outletId], type: 'ObjectId'}
                };
            }
            return {};
    }
};
