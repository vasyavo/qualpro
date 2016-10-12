define([
        'views/domain/list'
    ],

    function (ListView) {
        var View = ListView.extend({
            contentType : 'country',
            childContent: 'region'
        });

        return View;
    });

