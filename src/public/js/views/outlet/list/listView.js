define([
    'backbone',
    'jQuery',
    'Underscore',
    'views/paginator',
    'views/outlet/list/listItemsView',
    'views/domain/preView/preView',
    'views/domain/createView',
    'views/domain/editView',
    'text!templates/outlet/list/listHeader.html',
    'text!templates/domain/newRow.html'
],

function (Backbone, $, _, paginator, ListItemsView, PreView,
          CreateView, EditView, headerTemplate, newRow) {
    'use strict';

    var View = paginator.extend({
        el         : '#contentHolder',
        contentType: 'outlet',
        viewType   : 'list',
        CreateView : CreateView,
        EditView   : EditView,

        template   : _.template(headerTemplate),
        templateNew: _.template(newRow),

        events: {
            'click .checkboxLabel'        : 'checked',
            'click input[type="checkbox"]': 'inputClick',
            'click .listRow:not(label)'   : 'incClicks'
        },

        initialize: function (options) {
            this.translation = options.translation;
            this.filter = options.filter;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;
            this.page = options.collection.page;
            this.singleSelect = options.singleSelect;

            options.contentType = this.contentType;

            this.makeRender(options);

            //this.render();
        },

        listRowClick: function (e) {
            var $targetEl = $(e.target);
            var $targetRow = $targetEl.closest('tr');
            //var name = $targetRow.attr('data-name');
            var id = $targetRow.attr('data-id');

            var model = this.collection.get(id);

            new PreView({contentType: this.contentType, model: model, translation: this.translation});
        },

        showMoreContent: function (newModels) {
            var holder = this.$el;
            var itemView;
            var show = this.checkShowAccess();

            holder.find('.listTable').empty();

            this.trigger('hideActionDd');

            itemView = new ListItemsView({
                el         : this.$itemsEl,
                collection : newModels,
                contentType: this.contentType,
                tabName    : this.tabName,
                show       : show,
                translation: this.translation
            });

            holder.append(itemView.render());
            itemView.undelegateEvents();

            holder.find('#checkAll').prop('checked', false);
        },

        render: function () {
            var $currentEl = this.$el;
            var show = this.checkShowAccess();

            $currentEl.html('');
            $currentEl.append(this.template({
                show       : show,
                translation: this.translation
            }));

            this.$itemsEl = $currentEl.find('.listTable');

            $currentEl.append(new ListItemsView({
                el         : this.$itemsEl,
                collection : this.collection,
                tabName    : this.tabName,
                show       : show,
                translation: this.translation
            }).render());

            return this;
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
