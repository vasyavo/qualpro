define([
    'Backbone',
    'jQuery',
    'Underscore',
    'moment',
    'views/main/main',
    'views/login/login',
    'views/createSuperAdmin/createSuperAdmin',
    'views/forgotPassword/forgotPassword',
    'dataService',
    'custom',
    'constants/contentType',
    'js-cookie',
    'views/documents/list',
    'views/documents/topBar'
], function (Backbone, $, _, moment, mainView, LoginView, CreateSuperAdminView,
             forgotPassView, dataService, custom, CONSTANTS, Cookies,
             DocumentsListView, DocumentsTopBarView) {

    var appRouter = Backbone.Router.extend({

        wrapperView: null,
        mainView   : null,
        topBarView : null,
        view       : null,

        routes: {
            home : 'any',
            'login(/:confirmed)' : 'login',
            forgotPass : 'forgotPass',
            'qualPro/documents(/:filter)' : 'documentsHomePage',
            'qualPro/documents/:id(/:filter)' : 'showDocumentsView',
            'qualPro/customReports/:customReportType(/:tabName)(/filter=:filter)' : 'goToCustomReport',
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
                require(['translations/' + currentLanguage + '/documents', 'collections/documents/collection'], function (translation, collection) {
                    var documentsCollection = new collection();

                    //todo -> if folder

                    if (filter) {
                        filter = JSON.parse(filter);
                        documentsCollection.url = CONSTANTS.DOCUMENTS + '?' + $.param(filter);
                    }

                    var documentsTopBarView = new DocumentsTopBarView({
                        translation : translation,
                        collection : documentsCollection
                    });
                    $('#topBarHolder').html(documentsTopBarView.render().$el);

                    var documentsListView = new DocumentsListView({
                        collection : documentsCollection,
                        translation : translation
                    });

                    $('#contentHolder').html(documentsListView.render().$el);

                    documentsCollection.fetch();
                });
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
            App.$preLoader.fadeFn({
                visibleState: true
            });
            var self = this;
            this.checkLogin(function (success) {
                var currentUser;
                var breadcrumb;
                var domainFilter;
                var defaultFilters;
                var collectionUrl;
                var startTime;
                var topBarViewUrl;
                var contentViewUrl;
                var defCurFilter;
                var translationUrl;
                var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
                var $loader = $('#alaliLogo');
                if (!success) {
                    return self.redirectTo();
                }

                if (self.mainView === null) {
                    self.main(domainType);
                }

                contentViewUrl = 'views/domain/' + viewType;
                topBarViewUrl = 'views/domain/topBarView';
                startTime = new Date();
                collectionUrl = 'collections/' + domainType + '/collection';
                translationUrl = 'translations/' + currentLanguage + '/' + domainType;
                breadcrumb = {
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

                    require([
                        contentViewUrl,
                        topBarViewUrl,
                        collectionUrl,
                        'helpers/defFilterLogic',
                        translationUrl
                    ], function (ContentView, TopBar, Collection, DefFilters, translation) {
                        var contentViewOpts;
                        var collectionOpts;
                        var topBarOpts;

                        defaultFilters = new DefFilters(App.currentUser._id);
                        defCurFilter = defaultFilters.getDefFilter(domainType, tabName);
                        filter = filter ? JSON.parse(decodeURIComponent(filter)) : defCurFilter;
                        domainFilter = composeDomainFilter(domainType, parentId, subRegionId, retailSegmentId, outletId);
                        filter = _.extend(filter, domainFilter);

                        contentViewOpts = {
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
                        collectionOpts = {
                            Constructor: Collection,
                            options    : {
                                viewType     : viewType,
                                filter       : filter,
                                newCollection: true
                            }
                        };
                        topBarOpts = {
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
                    });
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

            var defaultFilters;
            var defCurFilter;

            if (context.mainView === null) {
                context.main(contentType);
            }

            function loadContent() {
                require([contentViewUrl,
                    topBarViewUrl,
                    collectionUrl,
                    'helpers/defFilterLogic',
                    translationUrl
                ], function (ContentView, TopBarView, ContentCollection, DefFilters, translation) {
                    var contentViewOpts;
                    var collectionOpts;
                    var topBarOpts;

                    defaultFilters = new DefFilters(App.currentUser._id);
                    defCurFilter = defaultFilters.getDefFilter(contentType, tabName);
                    filter = filter ? JSON.parse(decodeURIComponent(filter)) : defCurFilter;

                    contentViewOpts = {
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
                    collectionOpts = {
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
                    topBarOpts = {
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
                });
            }

            loadContent();
        },

        goToCustomReport: function (customReportType, tabName, filter) {
            var self = this;

            this.checkLogin(function (success) {
                var $loader = $('#alaliLogo');

                if (!success) {
                    return self.redirectTo();
                }

                if (App && App.filterCollections) {
                    delete App.filterCollections[customReportType];
                }

                if (tabName && tabName.indexOf('filter=') > -1) {
                    filter = tabName.replace('filter=', '');
                    tabName = null;
                    self.selectMenu('#qualPro/' + customReportType);
                }

                if (self.mainView === null) {
                    self.main(customReportType);
                }

                self.mainView.topMenu.currentCT = customReportType;

                function getCurrentCustomReport(options) {
                    var startTime = new Date();
                    var context = options.context;
                    var contentType = options.contentType;
                    var viewType = options.viewType || 'list';
                    var tabName = options.tabName || 'all';
                    var countPerPage = options.countPerPage;
                    var page = options.page || 1;
                    var filter = options.filter;
                    var self = context;
                    var contentViewUrl = 'views/customReport/' + contentType + '/reportView';
                    var topBarViewUrl = 'views/customReports/' + contentType + '/topBarView';
                    var collectionUrl = 'collections/' + contentType + '/collection';
                    var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
                    var translationUrl = 'translations/' + currentLanguage + '/' + contentType;
                    var defaultFilters;
                    var defCurFilter;
                    var currentUser;

                    if (context.mainView === null) {
                        context.main(contentType);
                    }

                    function loadContent() {
                        require([contentViewUrl,
                            topBarViewUrl,
                            collectionUrl,
                            'helpers/defFilterLogic',
                            translationUrl
                        ], function (ContentView, TopBarView, ContentCollection, DefFilters, translation) {
                            var contentViewOpts;
                            var collectionOpts;
                            var topBarOpts;

                            defaultFilters = new DefFilters(App.currentUser._id);
                            defCurFilter = defaultFilters.getDefFilter(contentType, tabName);
                            filter = filter ? JSON.parse(decodeURIComponent(filter)) : defCurFilter;

                            contentViewOpts = {
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
                            collectionOpts = {
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
                            topBarOpts = {
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
                        });
                    }

                    loadContent();
                }

                if (!$loader.hasClass('smallLogo')) {
                    $loader
                        .addClass('animated');

                    setTimeout(function () {
                        $loader
                            .addClass('smallLogo')
                            .removeClass('ellipseAnimated');

                        self.getCurrentCustomReport({
                            context     : self,
                            contentType : customReportType,
                            page        : 1,
                            countPerPage: 25,
                            tabName     : tabName,
                            filter      : filter
                        });
                    }, 1000);
                } else {
                    self.getCurrentCustomReport({
                        context     : self,
                        contentType : customReportType,
                        page        : 1,
                        countPerPage: 25,
                        tabName     : tabName,
                        filter      : filter
                    });
                }

            });
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
    return appRouter;
});
