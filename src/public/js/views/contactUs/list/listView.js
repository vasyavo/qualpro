define([
        'Backbone',
        'jQuery',
        'Underscore',
        'moment',
        'text!templates/contactUs/list/list.html',
        'views/contactUs/preView/preView',
        'views/filter/filtersBarView',
        'views/paginator',
        'constants/contentType'
    ], function (Backbone, $, _, moment, template, PreView, filterView, paginator, CONTENT_TYPES) {
        'use strict';

        var View = paginator.extend({
            contentType: CONTENT_TYPES.CONTACT_US,
            viewType   : 'list',
            template   : _.template(template),

            events: {
                'click .listRow': 'incClicks'
            },

            initialize: function (options) {
                this.translation = options.translation;
                this.filter = options.filter;
                this.tabName = options.tabName;
                this.collection = options.collection;
                this.defaultItemsNumber = this.collection.pageSize;
                this.listLength = this.collection.totalRecords;

                options.contentType = this.contentType;

                this.makeRender(options);
            },

            listRowClick: function (e) {
                var targetEl = $(e.target);
                var $targetRow = targetEl.closest('.listRow');
                var id = $targetRow.attr('data-id');
                var model = this.collection.get(id);
                var self = this;

                e.stopPropagation();

                this.preView = new PreView({
                    model      : model,
                    translation: this.translation
                });
                this.preView.on('modelChanged', function (count) {
                    self.changeCommentCount(count, $targetRow);
                });
            },

            changeCommentCount: function (count, $targetRow) {
                $targetRow.find('.userMassage').text(count);
            },

            prepareDataToDisplay : function (data) {
                _.each(data, (model) => {
                    model.createdBy.user.name = `${model.createdBy.user.firstName[App.currentUser.currentLanguage]} ${model.createdBy.user.lastName[App.currentUser.currentLanguage]}`;
                    model.country.name.currentLanguage = model.country.name[App.currentUser.currentLanguage];
                    model.createdAt = moment(model.createdAt).format('DD.MM.YYYY');
                });
            },

            showMoreContent: function (newModels) {
                var $currentEl = this.$el;
                var $holder = $currentEl.find('.reportingWrap');
                var jsonCollection = newModels.toJSON();

                this.prepareDataToDisplay(jsonCollection);

                this.pageAnimation(this.collection.direction, $holder);

                $holder.empty();
                $holder.html(this.template({
                    collection : jsonCollection,
                    translation: this.translation
                }));
            },

            render: function () {
                var $currentEl = this.$el;
                var jsonCollection = this.collection.toJSON();
                var $holder;

                this.prepareDataToDisplay(jsonCollection);

                $currentEl.html('');
                $currentEl.append('<div class="absoluteContent listnailsWrap"><div class="listnailsHolder scrollable"><div class="reportingWrap"></div></div></div>');

                $holder = $currentEl.find('.reportingWrap');
                $holder.append(this.template({
                    collection : jsonCollection,
                    translation: this.translation
                }));

                return this;
            }
        });

        return View;
    });
