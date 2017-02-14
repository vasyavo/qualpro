define([
    'backbone',
    'jQuery',
    'Underscore',
    'text!templates/outlet/thumbnails/thumbnailsView.html',
    'views/thumbnails',
    'dataService',
    'views/domain/createView',
    'views/domain/editView',
    'views/domain/preView/preView',
    'text!templates/domain/newThumbnail.html'
],

function (Backbone, $, _, thumbnailsTemplate, thumbnails, dataService,
          CreateView, EditView, PreView, newThumbnail) {
    'use strict';

    var View = thumbnails.extend({
        el         : '#contentHolder',
        viewType   : 'thumbnails',
        template   : _.template(thumbnailsTemplate),
        templateNew: _.template(newThumbnail),

        CreateView: CreateView,
        EditView  : EditView,

        view        : null,
        breadcrumbs : null,
        contentType : 'outlet',
        $mainContent: null,
        parentId    : null,

        events: {
            'click .checkboxLabel'             : 'checked', //method locate in paginator
            'click input[type="checkbox"]'     : 'inputClick',
            'click .thumbnail:not(label,input)': 'incClicks'
        },

        initialize: function (options) {
            this.filter = options.filter;
            this.ContentCollection = options.ContentCollection;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;
            this.page = options.collection.page;

            this.makeRender(options);
            //this.render();
        },

        render: function () {
            var $currentEl = this.$el;
            var self = this;
            var $holder;

            var show = this.checkShowAccess();

            $currentEl.html('');

            $currentEl.append('<div class="thumbnailsHolder scrollable"><div class="thumbnailsItems"></div></div>');

            $holder = $currentEl.find('.thumbnailsItems');

            $holder.append(this.template({
                collection: self.collection.toJSON(),
                tabName   : this.tabName,
                show      : show
            }));

            return this;
        },

        showPreview: function (e) {
            var targetEl = $(e.target);
            var targetDivContainer = targetEl.closest('.thumbnail.outlet');
            var id = targetDivContainer.attr('data-id');

            var model = this.collection.get(id);

            new PreView({contentType: this.contentType, model: model, translation: this.translation});
        },

        showMoreContent: function (newModels) {
            var $currentEl = this.$el;
            var $holder = $currentEl.find('.thumbnailsItems');
            var jsonCollection = newModels.toJSON();

            this.pageAnimation(this.collection.direction, $holder);

            this.trigger('hideActionDd');
            this.trigger('unCheckSelectAll');

            jsonCollection.contentType = this.contentType;

            var show = this.checkShowAccess();

            $holder.empty();
            $holder.html(this.template({
                collection: jsonCollection,
                tabName   : this.tabName,
                show      : show
            }));

            $holder.find('#checkAll').prop('checked', false);
        },

        checkShowAccess: function () {
            var accessLevel = App.currentUser.accessRole.level;
            var contentType = this.contentType;

            var checkBoxesObject = {
                2: ['country'],
                9: ['country'],
                3: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
                4: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
            };

            if (checkBoxesObject.hasOwnProperty(accessLevel) && checkBoxesObject[accessLevel].indexOf(contentType) !== -1) {
                return false;
            }
            return true;
        }

    });

    return View;
});

