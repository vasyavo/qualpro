define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/paginator',
    'views/shelfShares/brandPreview',
    'text!templates/shelfShares/list/list.html',
    'text!templates/shelfShares/list/categories.html',
    'text!templates/shelfShares/list/header.html',
    'text!templates/shelfShares/list/body.html',
    'constants/contentType',
    'dataService'
], function (Backbone, $, _, paginator, BrandPreview, template, CategoriesTemplate, HeaderTemplate, BodyTemplate, contentTypes, dataService) {
    'use strict';

    var View = paginator.extend({
        el         : '#contentHolder',
        contentType: contentTypes.SHELFSHARES,
        viewType   : 'list',

        template          : _.template(template),
        categoriesTemplate: _.template(CategoriesTemplate),
        headerTemplate    : _.template(HeaderTemplate),
        bodyTemplate      : _.template(BodyTemplate),

        events: {
            'click .showAllBrands': 'listRowClick'
        },

        initialize: function (options) {
            this.translation = options.translation;
            this.filter = options.filter;
            this.tabName = options.tabName;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;

            options.contentType = this.contentType;

            this.makeRender(options);
        },

        listRowClick: function (e) {
            var $targetEl = $(e.target);
            var $targetRow = $targetEl.closest('.showAllBrands');
            var categoryId = $targetRow.attr('data-category-id');
            var brandId = $targetRow.attr('data-brand-id');
            var self = this;
            var filter = _.extend({}, this.filter);
            if (!filter.category) {
                filter.category = {
                    type  : 'ObjectId',
                    values: [categoryId]
                };
            }

            dataService.getData('/' + this.contentType + '/brands', {
                brand : brandId,
                filter: filter
            }, function (err, res) {
                if (err) {
                    return App.render(err);
                }

                self.brandPreview = new BrandPreview({
                    models     : res,
                    category   : categoryId,
                    brand      : brandId,
                    translation: self.translation
                });
            });
        },

        showMoreContent: function (newModels) {
            var $currentEl = this.$el;
            var jsonCollection = newModels.toJSON();
            var brandsLengths = _.pluck(jsonCollection, 'brandsLength');
            var maxBrandsLength = Math.max.apply(null, brandsLengths);
            var $leftHiddenScroll;
            var $topHiddenScroll;
            var $customScroll;

            if (!this.collection.length) {
                return $currentEl.html('');
            }

            this.pageAnimation(this.collection.direction, $currentEl);

            $currentEl.empty();

            $currentEl.html(this.template({
                translation: this.translation
            }));

            $currentEl.find('#shelfSharesHeader').html(this.headerTemplate({
                maxBrandsLength: maxBrandsLength,
                translation    : this.translation
            }));

            $currentEl.find('#categoriesBody').html(this.categoriesTemplate({
                collection : jsonCollection,
                translation: this.translation
            }));

            $currentEl.find('#shelfSharesBody').html(this.bodyTemplate({
                collection     : jsonCollection,
                maxBrandsLength: maxBrandsLength,
                translation    : this.translation
            }));

            $leftHiddenScroll = $currentEl.find('#shelfShareLeftScroll');
            $topHiddenScroll = $currentEl.find('#shelfShareTopScroll');
            $customScroll = $currentEl.find('#shelfShareRightScroll');

            $customScroll.mCustomScrollbar({
                axis     : 'yx',
                callbacks: {
                    whileScrolling: function () {
                        var scroll = this.mcs;
                        var verticalScrollValue = scroll.top;
                        var horizontalScrollValue = scroll.left;

                        if (scroll.direction === 'y') {
                            $leftHiddenScroll.scrollTop(-verticalScrollValue);
                        } else {
                            $topHiddenScroll.scrollLeft(-horizontalScrollValue);
                        }

                    }
                }
            });
        },

        render: function () {
            var $currentEl = this.$el;
            var jsonCollection = this.collection.toJSON();
            var brandsLengths = _.pluck(jsonCollection, 'brandsLength');
            var maxBrandsLength = Math.max.apply(null, brandsLengths);
            var $leftHiddenScroll;
            var $topHiddenScroll;
            var $customScroll;

            if (!this.collection.length) {
                return $currentEl.html('');
            }


            $currentEl.html(this.template({
                translation: this.translation
            }));

            $currentEl.find('#shelfSharesHeader').html(this.headerTemplate({
                maxBrandsLength: maxBrandsLength,
                translation    : this.translation
            }));

            $currentEl.find('#categoriesBody').html(this.categoriesTemplate({
                collection : jsonCollection,
                translation: this.translation
            }));

            $currentEl.find('#shelfSharesBody').html(this.bodyTemplate({
                collection     : jsonCollection,
                maxBrandsLength: maxBrandsLength,
                translation    : this.translation
            }));

            $leftHiddenScroll = $currentEl.find('#shelfShareLeftScroll');
            $topHiddenScroll = $currentEl.find('#shelfShareTopScroll');
            $customScroll = $currentEl.find('#shelfShareRightScroll');

            $customScroll.mCustomScrollbar({
                axis     : 'yx',
                callbacks: {
                    whileScrolling: function () {
                        var scroll = this.mcs;
                        var verticalScrollValue = scroll.top;
                        var horizontalScrollValue = scroll.left;

                        if (scroll.direction === 'y') {
                            $leftHiddenScroll.scrollTop(-verticalScrollValue);
                        } else {
                            $topHiddenScroll.scrollLeft(-horizontalScrollValue);
                        }

                    }
                }
            });

            $leftHiddenScroll.on('mousewheel DOMMouseScroll', _.debounce(function (event) {
                var $scroll = $customScroll.find('.mCSB_scrollTools_vertical');
                var $dragger = $scroll.find('.mCSB_dragger');
                var railHeight = $scroll.find('.mCSB_draggerRail').outerHeight();
                var currentPosition = $dragger.position().top;
                var height = $dragger.height();
                var mouseScrollTo;

                mouseScrollTo = (-event.deltaY * event.deltaFactor);
                currentPosition = currentPosition + mouseScrollTo;

                if (currentPosition <= 0) {
                    currentPosition = 0.1;
                }

                if (currentPosition > (railHeight - height)) {
                    currentPosition = railHeight - height;
                }

                $customScroll.mCustomScrollbar('scrollTo', {y: currentPosition, x: 0}, {moveDragger: true});
            }, 500, true));

            return this;
        }

    });

    return View;
});
