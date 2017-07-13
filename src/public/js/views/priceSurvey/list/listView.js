var _ = require('underscore');
var $ = require('jQuery');
var paginator = require('../../../views/paginator');
var BrandPreview = require('../../../views/priceSurvey/brandPreview');
var template = require('../../../../templates/priceSurvey/list/list.html');
var CategoriesTemplate = require('../../../../templates/priceSurvey/list/categories.html');
var HeaderTemplate = require('../../../../templates/priceSurvey/list/header.html');
var BodyTemplate = require('../../../../templates/priceSurvey/list/body.html');
var BranchDataTemplate = require('../../../../templates/priceSurvey/list/branchData.html');
var CONTENT_TYPES = require('../../../constants/contentType');
var dataService = require('../../../dataService');
var BadgeStore = require('../../../services/badgeStore');

module.exports = paginator.extend({
    el         : '#contentHolder',
    contentType: CONTENT_TYPES.PRICESURVEY,
    viewType   : 'list',

    template          : _.template(template),
    categoriesTemplate: _.template(CategoriesTemplate),
    headerTemplate    : _.template(HeaderTemplate),
    bodyTemplate      : _.template(BodyTemplate),
    branchDataTemplate: _.template(BranchDataTemplate),

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

        BadgeStore.cleanupPriceSurvey();

        this.makeRender(options);
    },

    listRowClick: function (e) {
        var $targetEl = $(e.target);
        var $targetRow = $targetEl.closest('.showAllBrands');
        var category = $targetRow.attr('data-category');
        var brand = $targetRow.attr('data-brand');
        var variant = $targetRow.attr('data-variant');
        var size = $targetRow.attr('data-size');
        var branch = $targetRow.attr('data-branch');
        var self = this;
        var filter = _.extend({}, this.filter);
        if (!filter.category) {
            filter.category = {
                type  : 'ObjectId',
                values: [category]
            };
        }
        if (!filter.brand) {
            filter.brand = {
                type  : 'ObjectId',
                values: [brand]
            };
        }
        if (!filter.variant) {
            filter.variant = {
                type  : 'ObjectId',
                values: [variant]
            };
        }
        if (!filter.size) {
            filter.size = {
                type  : 'string',
                values: [size]
            };
        }
        if (!filter.branch) {
            filter.branch = {
                type  : 'ObjectId',
                values: [branch]
            };
        }

        dataService.getData('/' + this.contentType + '/brands', {filter: filter}, function (err, res) {
            if (err) {
                return App.render(err);
            }

            self.brandPreview = new BrandPreview({
                models     : res,
                category   : category,
                brand      : brand,
                variant    : variant,
                size       : size,
                branch     : branch,
                translation: self.translation
            });

            self.brandPreview.on('update-list-view', function () {
                self.collection.getPage(self.collection.currentPage, {
                    filter: self.filter,
                });
            });
        });
    },

    fillTableWithData: function (collection) {
        var self = this;
        var $mainTable = this.$el.find('#priceSurveyBody');

        collection.forEach(function (model) {
            model.brands.forEach(function (brand) {
                brand.variants.forEach(function (variant) {
                    variant.branches.forEach(function (branch) {
                        var categoryAttr = '[data-category="' + model.category._id + '"]';
                        var brandAttr = '[data-brand="' + brand.brand._id + '"]';
                        var variantAttr = '[data-variant="' + variant.variant._id + '"]';
                        var sizeAttr = '[data-size="' + variant.size + '"]';
                        var branchAttr = '[data-branch="' + branch.branch._id + '"]';

                        var selector = categoryAttr + brandAttr + variantAttr + sizeAttr + branchAttr;

                        $mainTable
                            .find(selector)
                            .addClass('showAllBrands')
                            .html(self.branchDataTemplate(branch));
                    });
                });
            });
        });
    },

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var jsonCollection = newModels.toJSON();
        var branchesAll = jsonCollection[0] && jsonCollection[0].branchesAll || [];
        var branchesAllLenght = branchesAll.length;
        var currency = jsonCollection[0] && jsonCollection[0].currency || '';
        var $leftHiddenScroll;
        var $topHiddenScroll;
        var $customScroll;

        if (!this.collection.length || !this.filter.country) {
            return $currentEl.html('');
        }

        this.pageAnimation(this.collection.direction, $currentEl);

        $currentEl.empty();

        $currentEl.html(this.template({
            translation: this.translation
        }));

        $currentEl.find('#priceSurveyHeader').html(this.headerTemplate({
            branchesAll      : branchesAll,
            branchesAllLenght: branchesAllLenght,
            translation      : this.translation,
            currency         : currency
        }));

        $currentEl.find('#categoriesBody').html(this.categoriesTemplate({
            collection : jsonCollection,
            translation: this.translation
        }));

        $currentEl.find('#priceSurveyBody').html(this.bodyTemplate({
            collection       : jsonCollection,
            branchesAll      : branchesAll,
            branchesAllLenght: branchesAllLenght,
            translation      : this.translation
        }));

        this.fillTableWithData(jsonCollection);

        $leftHiddenScroll = $currentEl.find('#priceSurveyLeftScroll');
        $topHiddenScroll = $currentEl.find('#priceSurveyTopScroll');
        $customScroll = $currentEl.find('#priceSurveyRightScroll');

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
        var branchesAll = jsonCollection[0] && jsonCollection[0].branchesAll || [];
        var branchesAllLenght = branchesAll.length;
        var currency = jsonCollection[0] && jsonCollection[0].currency || '';

        var $leftHiddenScroll;
        var $topHiddenScroll;
        var $customScroll;

        if (!this.collection.length || !this.filter.country) {
            return $currentEl.html('');
        }

        $currentEl.html(this.template({
            translation: this.translation
        }));

        $currentEl.find('#priceSurveyHeader').html(this.headerTemplate({
            branchesAll      : branchesAll,
            branchesAllLenght: branchesAllLenght,
            translation      : this.translation,
            currency         : currency
        }));

        $currentEl.find('#categoriesBody').html(this.categoriesTemplate({
            collection : jsonCollection,
            translation: this.translation
        }));

        $currentEl.find('#priceSurveyBody').html(this.bodyTemplate({
            collection       : jsonCollection,
            branchesAll      : branchesAll,
            branchesAllLenght: branchesAllLenght,
            translation      : this.translation
        }));

        this.fillTableWithData(jsonCollection);

        $leftHiddenScroll = $currentEl.find('#priceSurveyLeftScroll');
        $topHiddenScroll = $currentEl.find('#priceSurveyTopScroll');
        $customScroll = $currentEl.find('#priceSurveyRightScroll');

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
