define([
        'underscore',
        'collections/parrent',
        'models/variant',
        'constants/contentType'
    ],
    function (_, Parrent, Model, CONTENT_TYPES) {
        var Collection = Parrent.extend({
            model      : Model,
            url        : "/variant",
            viewType   : null,
            contentType: CONTENT_TYPES.VARIANT,
            sortOrder  : 1,

            initialize: function (options) {
                var page;

                options = options || {};
                page = options.page;
                options.reset = true;

                this.getPage(page, options);
            },
            comparator: function (modelA, modelB) {
                var nameA = getName(modelA);
                var nameB = getName(modelB);

                function getName(model) {
                    var employeeAttr = model.get('name');

                    if (employeeAttr) {
                        return model.get('name').currentLanguage;
                    }

                    return false;
                }

                if (nameA && nameB) {
                    if (nameA > nameB) {
                        return this.sortOrder;
                    }

                    if (nameA < nameB) {
                        return this.sortOrder * (-1);
                    }

                    return 0;
                }
            }
        });
        return Collection;
    });