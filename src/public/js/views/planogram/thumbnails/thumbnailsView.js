define(['Backbone',
        'jQuery',
        'Underscore',
        'constants/contentType',
        'text!templates/planogram/thumbnails/thumbnails.html',
        'text!templates/planogram/thumbnails/newThumbnail.html',
        'views/thumbnails',
        'views/planogram/manageView',
        'views/planogram/createView',
        'views/planogram/preView/preView',
        'constants/contentType'
    ],

    function (Backbone, $, _, CONSTANTS, thumbnailsTemplate, NewThumbnail, thumbnails,
              manageView, createView, PreView, CONTENT_TYPES) {
        'use strict';

        var View = thumbnails.extend({
            contentType: CONTENT_TYPES.PLANOGRAM,
            viewType   : 'thumbnails',
            template   : _.template(thumbnailsTemplate),
            templateNew: _.template(NewThumbnail),

            CreateView: createView,
            EditView  : manageView,

            events: {
                'click .checkboxLabel'             : 'checked',
                "click input[type='checkbox']"     : 'inputClick',
                'click .thumbnail:not(label,input)': 'incClicks'
            },

            initialize: function (options) {
                this.filter = options.filter;
                this.ContentCollection = options.ContentCollection;
                this.collection = options.collection;
                this.defaultItemsNumber = this.collection.pageSize;
                this.listLength = this.collection.totalRecords;
                this.page = options.collection.page;
                this.makeRender(options);
            },

            render: function () {
                var $currentEl = this.$el;
                var self = this;
                var $holder;

                $currentEl.html('');
                $currentEl.append('<div class="thumbnailsHolder scrollable"><div class="thumbnailsItems"></div></div>');

                $holder = $currentEl.find('.thumbnailsItems');

                $holder.append(this.template({
                    collection: self.collection.toJSON()
                }));

                return this;
            },

            showPreview: function (e) {
                var targetEl = $(e.target);
                var targetDivContainer = targetEl.closest('.thumbnail.planogram');
                var id = targetDivContainer.attr('data-id');
                var model = this.collection.get(id);
                var self = this;
                var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
                var translationUrl = 'translations/' + currentLanguage + '/' + CONSTANTS.PLANOGRAM;

                require([translationUrl], function (translation) {
                    self.translation = translation;

                    self.PreView = new PreView({
                        model      : model,
                        translation: translation
                    });
                    self.PreView.on('modelSaved', function (model) {
                        self.addReplaceRow(model);
                    }, self);
                });
            }

        });

        return View;
    });

