define([
        'text!templates/objectives/topBarTemplate.html',
        'text!templates/pagination/pagination.html',
        'views/baseTopBar',
        'constants/contentType'
    ],
    function (topBarTemplate, pagination, baseTopBar, CONTENT_TYPES) {
        var TopBarView = baseTopBar.extend({
            contentType       : CONTENT_TYPES.OBJECTIVES,
            template          : _.template(topBarTemplate),
            paginationTemplate: _.template(pagination),
        });

        return TopBarView;
    });