define(function(require) {
    var _ = require('underscore');
    var Backbone = require('backbone');
    var $ = require('jQuery');
    var headerTemplate = require('text!templates/domain/listHeader.html');
    var ListItemsView = require('views/domain/listItemsView');
    var paginator = require('views/paginator');
    var CreateView = require('views/domain/createView');
    var EditView = require('views/domain/editView');
    var newRow = require('text!templates/domain/newRow.html');
    var createLogicForDomainView = require('helpers/createLogicForDomainView');
    var BadgeStore = require('services/badgeStore');

    var View = paginator.extend({
        el         : '#contentHolder',
        viewType   : 'list',
        template   : _.template(headerTemplate),
        CreateView : CreateView,
        EditView   : EditView,
        templateNew: _.template(newRow),

        view       : null,
        breadcrumbs: null,
        contentType: null,
        parentId   : null,

        events: {
            "click .checkboxLabel"        : "checked", //method located in paginator
            "click input[type='checkbox']": "inputClick",//just for prevent thumbnailsClick
            "click .listRow:not(label)"   : "listRowClick"
        },

        initialize: function (options) {
            this.filter = options.filter;
            this.logic = createLogicForDomainView(this);
            this.logic.initializeView(options);
            this.tabName = options.tabName || 'all';
            this.contentType = options.contentType;

            BadgeStore.cleanupCountries();

            this.makeRender(options);
        },

        render: function () {
            var $currentEl = this.$el;
            var show = this.checkShowAccess();

            $currentEl.html('');
            $currentEl.append(this.template({
                translation: this.translation,
                contentType: this.contentType,
                show: show
            }));

            this.$itemsEl = $currentEl.find('.listTable');

            this.collection.contentType = this.contentType;

            $currentEl.append(new ListItemsView({
                el          : this.$itemsEl,
                contentType : this.contentType,
                collection  : this.collection,
                childContent: this.childContent,
                tabName     : this.tabName,
                show        : show
            }).render());

            if (!this.breadcrumbs) {
                this.logic.createBreadcrumbs();
            }

            this.correctView(this.contentType);

            return this;
        },

        correctView: function (childName) {
            var $currentEl = this.$el;
            var ifBranch = childName ? childName === 'branch' : this.contentType === 'branch';

            $currentEl.find('.forChange').toggle(!ifBranch);
            $currentEl.find('.changeColSpan').attr('colspan', !ifBranch ? 4 : 3);
        },

        showMoreContent: function (newModels) {
            var $holder = this.$el;
            var itemView;

            if (!this.breadcrumbs) {
                this.logic.createBreadcrumbs();
            }

            this.trigger('hideActionDd');

            $holder.find(".listTable").empty();

            var show = this.checkShowAccess();

            itemView = new ListItemsView({
                collection : newModels,
                contentType: this.contentType,
                page       : $holder.find("#currentShowPage").val(),
                itemsNumber: $holder.find("span#itemsNumber").text(),
                tabName    : this.tabName,
                show       : show
            });

            $holder.append(itemView.render());
            itemView.undelegateEvents();

            $holder.find('#checkAll').prop('checked', false);
        },

        listRowClick: _.debounce(function (e) {
            var targetEl = $(e.target);
            var targetRow = targetEl.closest('tr');
            var name = targetRow.attr('data-name');
            var id = targetRow.attr("data-id");

            if (this.childContent) {
                this.childContentLoader(this.childContent, id, name, this.tabName);
                this.trigger('hideActionDd');
            } else {
                this.previewItem(id);
            }
        }, 1000, true),

        createItem: function () {
            this.logic.createNewItem(this.translation);
        },

        /*addItem: function (model) {
         this.$el.find('.listTable').prepend(this.templateNewRow({model: model.toJSON()}));
         },*/

        childContentLoader: function (childName, parentId, parentName, parentTabName) {
            if (parentTabName === true) {
                parentTabName = 'archived';
            } else if (parentTabName === false) {
                parentTabName = 'all';
            }

            this.logic.loadChildContent(childName, parentId, parentName, parentTabName);
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
