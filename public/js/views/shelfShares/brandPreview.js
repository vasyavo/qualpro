define([
    'jQuery',
    'underscore',
    'text!templates/shelfShares/preview.html',
    'text!templates/shelfShares/previewBody.html',
    'collections/shelfShares/brandCollection',
    'views/baseDialog',
    'constants/contentType',
    'dataService'
], function ($, _, PreviewTemplate, PreviewBodyTemplate, ShelfSharesBrandCollection, BaseView, CONTENT_TYPES, dataService) {
    var preView = BaseView.extend({
        contentType: CONTENT_TYPES.SHELFSHARES,

        template           : _.template(PreviewTemplate),
        previewBodyTemplate: _.template(PreviewBodyTemplate),

        events: {},

        initialize: function (options) {
            var self = this;
            this.translation = options.translation;

            options.contentType = this.contentType;

            this.category = options.category;
            this.brand = options.brand;

            this.collection = new ShelfSharesBrandCollection(options.models, {parse: true});
            this.makeRender(options);
            this.render();

            this.brandSearchEvent = _.debounce(function (e) {
                var $el = $(e.target);
                var value = $el.val();

                self.brandSearch(value);
            }, 500);

            this.$el.find('#brandSearch').on('input', this.brandSearchEvent);
        },

        brandSearch: function (value) {
            var self = this;

            dataService.getData('/' + this.contentType + '/brands', {
                category: this.category,
                brand   : this.brand,
                search  : value
            }, function (err, res) {
                if (err) {
                    return App.render(err);
                }

                self.collection = new ShelfSharesBrandCollection(res, {parse: true});
                self.showMoreContent(self.collection.toJSON());
            });
        },

        showMoreContent: function (newModels) {
            var $mainContent = this.$el.find('#mainContent');

            $mainContent.empty();
            $mainContent.html(this.previewBodyTemplate({
                collection : newModels,
                translation: this.translation
            }));
        },

        render: function () {
            var jsonCollection = this.collection.toJSON();
            var formString = this.template({
                translation: this.translation
            });

            this.$el = $(formString).dialog({
                dialogClass  : 'self-share-dialog',
                title        : '',
                showCancelBtn: false,
                buttons      : {
                    ok: {
                        text : 'OK',
                        class: 'btn',
                        click: function () {
                            $(this).dialog('close').dialog('destroy').remove();
                        }
                    }
                }
            });

            this.$el.find('#mainContent').html(this.previewBodyTemplate({
                collection : jsonCollection,
                translation: this.translation
            }));

            this.delegateEvents(this.events);

            return this;
        }
    });

    return preView;
});
