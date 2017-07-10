// TODO: Remove itemsPrices collection (after renaming of itemsPrises to items in whole project), because it is a duplicate of item collection
define(function(require) {
    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Parent = require('collections/parrent');
    var Model = require('models/itemsPrices');
    var CONTENT_TYPES = require('constants/contentType');

    var Collection = Parent.extend({
        model      : Model,
        url        : CONTENT_TYPES.ITEM,
        viewType   : null,
        contentType: null,

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
                var categoryNameEn = elem.category.name.en || '';
                var categoryNameAr = elem.category.name.ar || '';
                var variantNameEn = elem.variant.name.en || '';
                var variantNameAr = elem.variant.name.ar || '';

                var nameSearchResult = (nameEn.match(regex) || nameAr.match(regex));
                var categorySearchResult = (categoryNameAr.match(regex) || categoryNameEn.match(regex));
                var variantSearchResult = (variantNameEn.match(regex) || variantNameAr.match(regex));

                return elem.exists === exists && (nameSearchResult || categorySearchResult || variantSearchResult);
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