define(function(require) {
    var _ = require('underscore');
    var Backbone = require('backbone');
    var $ = require('jQuery');
    var headerTemplate = require('text!templates/activityList/list/header.html');
    var personPreView = require('views/personnel/preView/preView');
    var ListItemsView = require('views/activityList/list/listItemsView');
    var paginator = require('views/paginator');
    var personnelModel = require('models/personnel');
    var REGEXP = require('constants/validation');
    var dataService = require('dataService');
    var moment = require('moment');
    var BadgeStore = require('services/badgeStore');

    var View = paginator.extend({
        contentType: 'activityList',
        viewType   : 'list',
        template   : _.template(headerTemplate),

        events: {
            'click tr .person': 'personnelClick'
        },

        REGEXP: REGEXP,

        initialize: function (options) {
            this.translation = options.translation;
            this.tabName = options.tabName;
            this.filter = options.filter;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;
            this.singleSelect = options.singleSelect;
            this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';

            options.contentType = this.contentType;

            BadgeStore.cleanupActivityList();

            this.makeRender(options);
        },

        inputClick_: function (e) {
            e.stopPropagation();

            this.checkAvailableSendPass();
            this.inputClick(e);
        },

        rowClick: function (e) {
            var self = this;
            var $tr = $(e.currentTarget);
            var activityid = $tr.attr('data-id');
            if (!activityid) {
                return false;
            }
            var model = this.collection.get(activityid);
            var modelJSON = model.toJSON();
            var moduleObject = modelJSON.module;
            var id = modelJSON.itemId;
            var missingPreviews = ['branch', 'priceSurvey', 'shelfShares', 'competitorsList', 'country', 'itemsPrices', 'outlet', 'region',
                'retailSegment', 'subRegion'];
            var promotionsOrBrandingItems = ['promotionsItems', 'marketingCampaignItem'].indexOf(moduleObject.href) !== -1;
            var promotionItems = moduleObject.href === 'promotionsItems';
            var modelType = modelJSON.itemDetails || modelJSON.itemType;
            var countryIds = [];
            var branchIds = [];
            var countryNames = [];
            var branchNames = [];
            var personnelName = [];
            var href;
            var translationUrl;
            var targetModelUrl;
            var preViewUrl;
            var timeValues;
            var contentType;
            var filter;
            var url;
            var fromTime;
            var toTime;
            var timeDate;
            var activityList = id !== App.currentUser._id;

            e.stopPropagation();

            if (missingPreviews.indexOf(moduleObject ? moduleObject.href : modelType) === -1 || promotionsOrBrandingItems) {
                if (promotionsOrBrandingItems) {
                    href = promotionItems ? 'promotions' : 'marketingCampaign';
                }
                href = href ? href : moduleObject.href;
                translationUrl = 'translations/' + self.currentLanguage + '/' + href;
                if (href === 'inStoreTasks') {
                    targetModelUrl = 'models/taskFlow';
                } else {
                    targetModelUrl = 'models/' + href;
                }
                preViewUrl = 'views/' + href + '/preView/preView';

                require([
                        targetModelUrl,
                        preViewUrl,
                        translationUrl
                    ],
                    function (TargetModel, PreView, translation) {
                        var itemModel = new TargetModel({
                            _id : id
                        });
                        itemModel.on('sync', function (prettyModel) {
                            self.preView = new PreView({
                                model       : prettyModel,
                                translation : translation,
                                activityList: activityList
                            });
                            self.preView.on('disableEvent', this.archiveItems, this);
                            self.preView.on('openEditView', this.editItem, this);
                            itemModel.off('sync');
                        });
                        itemModel.fetch();
                    });
            } else if (['region', 'subRegion', 'country', 'retailSegment', 'outlet', 'branch'].indexOf(modelJSON.itemDetails) !== -1) {
                contentType = modelJSON.itemDetails;
                url = model.get('itemType');
                translationUrl = 'translations/' + self.currentLanguage + '/' + contentType;
                targetModelUrl = 'models/' + contentType;
                preViewUrl = 'views/' + url + '/preView/preView';

                require([
                        targetModelUrl,
                        preViewUrl,
                        translationUrl
                    ],
                    function (TargetModel, PreView, translation) {
                        var itemModel = new TargetModel({_id: id});
                        itemModel.on('sync', function (prettyModel) {
                            self.preView = new PreView({
                                model      : prettyModel,
                                translation: translation,
                                contentType: contentType

                            });
                            self.preView.on('disableEvent', this.archiveItems, this);
                            self.preView.on('openEditView', this.editItem, this);
                        });
                        itemModel.fetch();
                    });
            } else if (['priceSurvey', 'shelfShares'].indexOf(modelType) !== -1) {
                timeDate = modelJSON.createdBy.date;
                fromTime = timeDate ? moment(timeDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 0).set('minute', 1).toISOString() : null;
                toTime = timeDate ? moment(timeDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 23).set('minute', 59).toISOString() : null;
                timeValues = [fromTime, toTime];
                _.map(modelJSON.country, function (countryObj) {
                    countryIds.push(countryObj._id);
                    countryNames.push(countryObj.name[self.currentLanguage]);
                });
                _.map(modelJSON.branch, function (branchObj) {
                    branchIds.push(branchObj._id);
                    branchNames.push(branchObj.name[self.currentLanguage]);
                });

                personnelName.push(modelJSON.createdBy.user.firstName.currentLanguage + ' ' + modelJSON.createdBy.user.lastName.currentLanguage);

                filter = {
                    'createdBy.user': {
                        type  : 'ObjectId',
                        values: [modelJSON.createdBy.user._id],
                        names : personnelName
                    },

                    time: {
                        values: timeValues,
                        type  : 'date',
                        names : ['Fixed Period']
                    }
                };

                if (countryIds.length && countryNames.length) {
                    filter.country = {
                        type  : 'ObjectId',
                        values: countryIds,
                        names : countryNames
                    };
                }

                if (branchIds.length && branchNames.length) {
                    filter.branch = {
                        type  : 'ObjectId',
                        values: branchIds,
                        names : branchNames
                    };
                }

                dataService.getData(modelType + '/' + (model.get('itemId') || model.get('_id')), {}, function (err, response) {
                    if (err) {
                        return App.render({type: 'error', message: err.message});
                    }

                    if (response && response.category) {
                        filter.category = {
                                type  : 'ObjectId',
                                values: [response.category._id],
                                names : [response.category.name[self.currentLanguage]]
                            };
                    }

                    url = 'qualPro/' + modelType + '/all/list/p=1/c=25/filter=' + encodeURIComponent(JSON.stringify(filter));
                    Backbone.history.navigate(url, true);
                });
            } else if (['item'].indexOf(modelType) !== -1) {
                _.map(modelJSON.country, function (countryObj) {
                    countryIds.push(countryObj._id);
                    countryNames.push(countryObj.name[self.currentLanguage]);
                });

                filter = {
                    country: {
                        type  : 'ObjectId',
                        values: countryIds,
                        names : countryNames
                    }
                };

                dataService.getData(modelType + '/' + (model.get('itemId') || model.get('_id')), {}, function (err, response) {
                    if (err) {
                        return App.render({type: 'error', message: err.message});
                    }

                    if (response && response.category) {
                        filter.category = response && response.category && {
                                type  : 'ObjectId',
                                values: [response.category._id],
                                names : [response.category.name[self.currentLanguage]]
                            };
                    }

                    url = 'qualPro/itemsPrices/all/list/p=1/c=25/filter=' + encodeURIComponent(JSON.stringify(filter));
                    Backbone.history.navigate(url, true);
                });
            } else if (['competitorItem'].indexOf(modelType) !== -1) {
                _.map(modelJSON.country, function (countryObj) {
                    countryIds.push(countryObj._id);
                    countryNames.push(countryObj.name[self.currentLanguage]);
                });

                filter = {
                    country: {
                        type  : 'ObjectId',
                        values: countryIds,
                        names : countryNames
                    }
                };

                dataService.getData(modelType + '/' + (model.get('itemId') || model.get('_id')), {}, function (err, response) {
                    if (err) {
                        return App.render({type: 'error', message: err.message});
                    }

                    if (response && response.brand) {
                        filter.brand = response && response.brand && {
                                type  : 'ObjectId',
                                values: [response.brand._id],
                                names : [response.brand.name[self.currentLanguage]]
                            };
                    }

                    url = 'qualPro/competitorsList/all/list/p=1/c=25/filter=' + encodeURIComponent(JSON.stringify(filter));
                    Backbone.history.navigate(url, true);
                });
            }
        },

        personnelClick: function (e) {
            var self = this;
            var targetEl = $(e.target);
            var targetRow = targetEl.closest('.person');
            var id = targetRow.attr('data-id');
            var personModel = new personnelModel({_id: id});

            e.stopPropagation();

            personModel.on('sync', function (model) {
                var translationUrl = 'translations/' + self.currentLanguage + '/personnel';
                require([translationUrl], function (translation) {
                    self.personPreView = new personPreView({
                        model      : model,
                        translation: translation
                    });
                    self.personPreView.on('disableEvent', this.archiveItems, this);
                    self.personPreView.on('openEditView', this.editItem, this);
                });
            });
            personModel.fetch();
        },

        render: function () {
            var $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(this.template({
                translation: this.translation
            }));

            this.$itemsEl = $currentEl.find('.listTable');

            $currentEl.append(new ListItemsView({
                translation: this.translation,
                el         : this.$itemsEl,
                collection : this.collection
            }).render());

            this.$el.find('tbody.listTable tr').on('click', _.debounce(this.rowClick.bind(this), 1000, true));

            return this;
        },

        showMoreContent: function (newModels) {
            var $holder = this.$el;
            var itemView;

            this.pageAnimation(this.collection.direction, $holder);

            this.trigger('hideActionDd');

            $holder.find('.listTable').empty();

            itemView = new ListItemsView({
                el         : this.$itemsEl,
                collection : newModels,
                translation: this.translation
            });

            $holder.append(itemView.render());
            itemView.undelegateEvents();

            this.$el.find('tbody.listTable tr').on('click', _.throttle(this.rowClick.bind(this), 1000));

            $holder.find('#checkAll').prop('checked', false);
        }
    });

    return View;
});
