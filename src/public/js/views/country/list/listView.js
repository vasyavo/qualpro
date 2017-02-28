define(function(require) {
    var ListView = require('views/domain/list');

    var View = ListView.extend({

        contentType : 'country',
        childContent: 'region',

    });

    return View;
});
