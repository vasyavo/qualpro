define([
        'text!templates/contactUs/topBarTemplate.html',
        'text!templates/pagination/pagination.html',
        'views/baseTopBar'
    ],
    function (topBarTemplate, pagination, baseTopBar) {
        var TopBarView = baseTopBar.extend({
            contentType       : "contactUs",
            template          : _.template(topBarTemplate),
            paginationTemplate: _.template(pagination)
        });

        return TopBarView;
    });