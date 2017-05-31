define([
    'jQuery',
    'underscore',
    'text!templates/shelfShares/preview.html',
    'text!templates/shelfShares/previewBody.html',
    'collections/shelfShares/brandCollection',
    'views/baseDialog',
    'constants/contentType',
    'dataService',
    'views/shelfShares/editValue',
    'models/shelfSharesBrand',
    'constants/infoMessages',
    'constants/aclRoleIndexes'
], function ($, _, PreviewTemplate, PreviewBodyTemplate, ShelfSharesBrandCollection, BaseView, CONTENT_TYPES, dataService, EditShelfSharesValueView, ShelfSharesBrandModel, INFO_MESSAGES, ACL_ROLES) {
    var preView = BaseView.extend({
        contentType: CONTENT_TYPES.SHELFSHARES,

        template           : _.template(PreviewTemplate),
        previewBodyTemplate: _.template(PreviewBodyTemplate),

        events: {
            'click #edit': 'handleEditClick',
            'click #delete' : 'handleDeleteClick',
        },

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

        handleEditClick: function (event) {
            var that = this;
            var target = $(event.target);
            var currentValue = target.attr('data-value');

            this.editableShelfSharesId = target.attr('data-id');
            this.editableShelfSharesItemId = target.attr('data-item-id');

            this.editShelfSharesValueView = new EditShelfSharesValueView({
                translation: this.translation,
                initialValue: currentValue,
            });

            this.editShelfSharesValueView.on('new-value-submitted', function (value) {
                var model = new ShelfSharesBrandModel();

                model.editValueOfShelfSharesItem({
                    value: value,
                    shelfSharesId: that.editableShelfSharesId,
                    shelfSharesItemId: that.editableShelfSharesItemId,
                });

                model.on('shelf-shares-value-edited', function () {
                    that.$el.find('#' + that.editableShelfSharesId).html('' + value);
                    target.attr('data-value', value);
                    that.trigger('update-list-view');
                });
            });
        },

        handleDeleteClick: function (event) {
            if (confirm(INFO_MESSAGES.confirmDeleteShelfShareItem[App.currentUser.currentLanguage])) {
                var that = this;
                var target = $(event.target);
                var model = new ShelfSharesBrandModel();

                var shelfSharesIdToDelete = target.attr('data-id');
                var shelfSharesItemIdToDelete = target.attr('data-item-id');

                model.deleteItem(shelfSharesIdToDelete, shelfSharesItemIdToDelete);

                model.on('shelf-shares-value-deleted', function () {
                    that.$el.find('#shelf-share-item-block-' + shelfSharesItemIdToDelete).remove();

                    that.trigger('update-list-view');
                });
            }
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
            var permittedToManage = [ACL_ROLES.MASTER_ADMIN, ACL_ROLES.COUNTRY_ADMIN, ACL_ROLES.MASTER_UPLOADER, ACL_ROLES.COUNTRY_UPLOADER].includes(App.currentUser.accessRole.level);
            var jsonCollection = this.collection.toJSON();
            var optionsCol = '<th>' + this.translation.options + '</th>';
            var formString = this.template({
                translation: this.translation,
                permittedToManage: permittedToManage,
                optionsCol: optionsCol
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
                translation: this.translation,
                permittedToManage: permittedToManage
            }));

            this.delegateEvents(this.events);

            return this;
        }
    });

    return preView;
});
