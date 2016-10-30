define([
        'views/domain/list'
    ],

    function (ListView) {
        var View = ListView.extend({
            contentType: 'subRegion',
            childContent: 'retailSegment'
        });

        return View;
    });