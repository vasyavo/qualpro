define([
    'backbone',
    'Underscore',
    'jQuery',
    'collections/parrent',
    'models/item',
    'constants/contentType'
], function (Backbone, _, $, Parrent, Model, CONTENT_TYPES) {
    var Collection = Parrent.extend({
        model      : Model,
        url        : CONTENT_TYPES.ITEM,
        viewType   : null,
        contentType: null,
        sortOrder  : 1,

        initialize: function (options) {
            var page;

            options = options || {};
            page = options.page;
            options.reset = true;

            if (options.create !== false) {
                this.getPage(page, options);
            }
        },

        search: function (options) {
            var data = this.toJSON();
            var exists = options.exists;
            var text = options.text || '';
            var regex = new RegExp(text, 'i');

            data = _.filter(data, function (elem) {
                var nameEn = elem.name.en || '';
                var nameAr = elem.name.ar || '';

                return elem.exists === exists && (nameEn.match(regex) || nameAr.match(regex))
            });

            return this.createGroupedJsons(data)[exists];
        },

        changeExists: function (items) {
            var itemsArray = [];
            var self = this;

            if (items.constructor === Array) {
                itemsArray = items;
            } else {
                itemsArray.push(items);
            }

            itemsArray.forEach(function (itemId) {
                var model = self.get(itemId);
                var existsVal = model.get('exists');

                model.set({exists: !existsVal});
            });
        },

        createGroupedJsons: function (data) {
            var dataForGroup = data || this.toJSON();
            var groups = _.groupBy(dataForGroup, function (elem) {
                return elem.exists;
            });

            groups[true] = groups[true] ? groupByCategories(groups[true]) : [];
            groups[false] = groups[false] ? groupByCategories(groups[false]) : [];

            return groups;
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

    var groupByCategories = function (elements) {
        var categoryVariants;
        var categories = [];
        var variants = getVariants(elements);
        categoryVariants = _.groupBy(variants, function (variant) {
            return variant.category._id;
        });

        variants.forEach(function (variant) {
            var category = variant.category;

            if (!categories.contains(function (category) {
                    return category._id === variant.category._id
                })) {

                category.variants = categoryVariants[category._id];
                categories.push(category);
            }
        });

        return categories;
    };

    var getVariants = function (elements) {
        var variants = [];
        var variantItems = _.groupBy(elements, function (elem) {
            return elem.variant._id;
        });

        elements.forEach(function (elem) {
            var variant = elem.variant;

            if (!variants.contains(function (variant) {
                    return variant._id === elem.variant._id;
                })) {
                variant.category = elem.category;
                variant.items = variantItems[variant._id];
                variants.push(variant);
            }
        });

        return variants;
    };

    return Collection;
});