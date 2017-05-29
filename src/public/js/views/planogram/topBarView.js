define([
        'underscore',
        'text!templates/planogram/topBarTemplate.html',
        'text!templates/pagination/pagination.html',
        'views/baseTopBar',
        'views/planogram/manageView',
        'constants/contentType',
        'views/planogram/manageProductsInformation'
    ],
    function (_, topBarTemplate, pagination, baseTopBar, manageView, CONTENT_TYPES, ManageProductsInformationView) {
        var TopBarView = baseTopBar.extend({
            contentType       : CONTENT_TYPES.PLANOGRAM,
            template          : _.template(topBarTemplate),
            paginationTemplate: _.template(pagination),

            events: {
                'click #manageBtn': 'showManageDialog',
                'click #manage-block': 'toggleManageBlock',
                'click #namage-products': 'showManageProductsView'
            },

            toggleManageBlock: function () {
                this.$el.find('#manage-dropdown').toggleClass('showActionsDropDown');
            },

            showManageProductsView: function () {
                new ManageProductsInformationView({
                    translation: this.translation
                });
                this.$el.find('#manage-dropdown').removeClass('showActionsDropDown');
            },

            showManageDialog: _.debounce(function () {
                new manageView({
                    translation: this.translation
                });
                this.$el.find('#manage-dropdown').removeClass('showActionsDropDown');
            }, 1000, true)
        });

        return TopBarView;
    });