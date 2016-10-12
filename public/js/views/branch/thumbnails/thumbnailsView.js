define([
        'views/domain/thumbnails'
    ],

    function (MainThumbnails) {
        var View = MainThumbnails.extend({
            contentType: 'branch'

        });

        return View;
    });

