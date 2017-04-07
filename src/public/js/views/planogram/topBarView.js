define([
        'underscore',
        'text!templates/planogram/topBarTemplate.html',
        'text!templates/pagination/pagination.html',
        'views/baseTopBar',
        'views/planogram/manageView',
        'constants/contentType'
    ],
    function (_, topBarTemplate, pagination, baseTopBar, manageView, CONTENT_TYPES) {
        var TopBarView = baseTopBar.extend({
            contentType       : CONTENT_TYPES.PLANOGRAM,
            template          : _.template(topBarTemplate),
            paginationTemplate: _.template(pagination),

            events: {
                'click #manageBtn': 'showManageDialog'
            },

            showManageDialog: _.debounce(function () {
                new manageView({
                    translation: this.translation
                });
            }, 1000, true)
        });

        return TopBarView;
    });