define([
    'Backbone',
    'jQuery',
    'Underscore',
    'models/documents',
    'text!templates/documents/thumbnails/thumbnails.html',
    'text!templates/documents/thumbnails/newThumbnail.html',
    'views/thumbnails',
    'views/documents/createView',
    'views/documents/preView/preView',
    'views/documents/editView',
    'constants/contentType'
], function (Backbone, $, _, Model, thumbnailsTemplate, NewThumbnail, thumbnails, createView, PreView, EditView, CONTENT_TYPES) {
    'use strict';

    var View = thumbnails.extend({
        contentType: CONTENT_TYPES.DOCUMENTS,
        viewType   : 'thumbnails',
        template   : _.template(thumbnailsTemplate),
        templateNew: _.template(NewThumbnail),
        CreateView : createView,

        events: {
            'click .checkboxLabel'             : 'checked',
            "click input[type='checkbox']"     : 'inputClick',
            'click .thumbnail:not(label,input)': 'incClicks',
            'click .editContent'               : 'showEditDialog'
        },

        initialize: function (options) {
            this.filter = options.filter;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;
            this.page = options.collection.page;
            this.translation = options.translation;

            this.makeRender(options);
        },

        render: function () {
            var $currentEl = this.$el;
            var $holder;

            $currentEl.html('');
            $currentEl.append('<div class="thumbnailsHolder scrollable"><div class="thumbnailsItems"></div></div>');

            $holder = $currentEl.find('.thumbnailsItems');
            $holder.append(this.template({
                collection : this.collection.toJSON(),
                translation: this.translation
            }));
            return this;
        },

        showEditDialog: function (e) {
            var self = this;
            var id = $(e.target).closest('.documentItem').attr('data-id');
            var model = this.collection.get(id);

            e.stopPropagation();
            e.stopImmediatePropagation();

            this.editView = new EditView({model: model, translation: this.translation});
            this.editView.on('modelSaved', function (model) {
                self.collection.add(model, {merge: true});
                self.addReplaceRow(model);
            });
        },

        showPreview: function (e) {
            var targetEl = $(e.target);
            var targetDivContainer = targetEl.closest('.documentItem');
            var id = targetDivContainer.attr('data-id');
            var self = this;
            var url = self.collection.url + '/' + id;

            $.ajax({
                url        : url,
                type       : 'GET',
                contentType: false,
                processData: false,
                success    : function (model) {
                    var model = new Model(model, {parse: true});
                    self.PreView = new PreView({
                        model      : model,
                        translation: self.translation
                    });
                }
            });
        }
    });

    return View;
});
