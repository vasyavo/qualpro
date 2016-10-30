define([
        'views/domain/list'
    ],

    function (ListView) {
        var View = ListView.extend({
            contentType: 'branch',
            childContent: null
        });

        return View;
    });