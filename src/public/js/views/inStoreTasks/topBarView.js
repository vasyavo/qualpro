define([
        'text!templates/inStoreTasks/topBarTemplate.html',
        'text!templates/pagination/pagination.html',
        'views/baseTopBar',
        'constants/contentType'
    ],
    function (topBarTemplate, pagination, baseTopBar, CONTENT_TYPES) {
        'use strict';

        var TopBarView = baseTopBar.extend({
            contentType       : CONTENT_TYPES.INSTORETASKS,
            template          : _.template(topBarTemplate),
            paginationTemplate: _.template(pagination)
        });

        return TopBarView;
    });