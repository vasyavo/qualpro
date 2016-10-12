define([
        'views/domain/list'
    ],

    function (ListView) {
        var View = ListView.extend({
            contentType: 'region',
            childContent: 'subRegion'
        });

        return View;
    });