define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/activityList/list/header.html',
    'models/activityList',
    'views/personnel/preView/preView',
    'views/activityList/list/listItemsView',
    'views/filter/filtersBarView',
    'views/paginator',
    'models/personnel',
    'constants/validation',
    'dataService',
    'moment'

], function (Backbone, $, _, headerTemplate, Model, personPreView, ListItemsView, filterView,
             paginator, personnelModel, REGEXP, dataService, moment) {
    var View = paginator.extend({
        contentType: 'activityList',
        viewType   : 'list',
        template   : _.template(headerTemplate),

        events: {
            'click tr'        : 'rowClick',
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
            App.badge = 0;
            App.setMenuCount(1, App.badge);

            dataService.deleteData('/activityList/badge', {}, function () {
            });
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
            var promotionsOrBrandingItems = ['promotionsItems', 'brandingAndDisplayItems'].indexOf(moduleObject.href) !== -1;
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
                    href = promotionItems ? 'promotions' : 'brandingAndDisplay';
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
                        var itemModel = new TargetModel({_id: id});
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
                    country: {
                        type  : 'ObjectId',
                        values: countryIds,
                        names : countryNames
                    },

                    branch: {
                        type  : 'ObjectId',
                        values: branchIds,
                        names : branchNames
                    },

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
                url = 'qualPro/' + modelType + '/all/list/p=1/c=25/filter=' + encodeURIComponent(JSON.stringify(filter));
                Backbone.history.navigate(url, true);
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

            $holder.find('#checkAll').prop('checked', false);
        }
    });

    return View;
});