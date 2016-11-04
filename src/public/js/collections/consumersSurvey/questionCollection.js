define([
    'collections/parrent',
    'models/question'
], function (Parrent, Model) {
    var Collection = Parrent.extend({
        model      : Model,
        url        : '/question/',
        viewType   : null,
        contentType: null

        /*initialize: function (options) {
         var page;

         options = options || {};
         page = options.page;
         options.reset = true;

         //this.getPage(page, options);
         }*/
    });

    return Collection;
});
