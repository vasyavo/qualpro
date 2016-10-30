define([
        'text!templates/domain/topBarTemplate.html',
        'text!templates/pagination/pagination.html',
        'views/baseTopBar'
    ],
    function (topBarTemplate, pagination, baseTopBar) {
        var TopBarView = baseTopBar.extend({
            contentType       : "region",
            template          : _.template(topBarTemplate),
            paginationTemplate: _.template(pagination)
        });

        return TopBarView;
    });