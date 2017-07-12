var _ = require('underscore');
var $ = require('jQuery');
var template = require('../../../../templates/objectives/list/list.html');
var newRow = require('../../../../templates/objectives/list/newRow.html');
var createView = require('../../../views/objectives/createView');
var CreateSubObjectivesView = require('../../../views/objectives/createSubObjectivesView');
var EditObjectiveView = require('../../../views/objectives/editObjectiveView');
var PreView = require('../../../views/objectives/preView/preView');
var paginator = require('../../../views/paginator');
var CONTENT_TYPES = require('../../../constants/contentType');
var dataService = require('../../../dataService');
var BadgeStore = require('../../../services/badgeStore');

module.exports = paginator.extend({
    contentType: CONTENT_TYPES.OBJECTIVES,
    viewType   : 'list',
    template   : _.template(template),
    templateNew: _.template(newRow),

    CreateView: createView,

    events: {
        'click .listRow': 'incClicks'
    },

    initialize: function (options) {
        this.translation = options.translation;
        this.filter = options.filter;
        this.tabName = options.tabName;
        this.collection = options.collection;
        this.defaultItemsNumber = this.collection.pageSize;
        this.listLength = this.collection.totalRecords;

        options.contentType = this.contentType;

        BadgeStore.cleanupObjective();

        this.makeRender(options);
    },

    listRowClick: function (e) {
        var self = this;
        var targetEl = $(e.target);
        var targetRow = targetEl.closest('.listRow');
        var id = targetRow.attr('data-id');
        var collection =  this.collection;
        var model = collection.get(id);

        self.preView = new PreView({
            model      : model,
            translation: self.translation,
            tabName    : this.tabName
        });

        self.preView.on('modelSaved', function (model) {
            self.collection.add(model, {merge: true});
            self.addReplaceRow(model);
        });
        self.preView.on('showSubObjectiveDialog', self.showSubObjectiveDialog, self);
        self.preView.on('showAssignObjectiveDialog', self.showAssignObjectiveDialog, self);
        self.preView.on('showEditObjectiveDialog', self.showEditObjectiveDialog, self);
        collection.once('remove', function () {
            collection.totalRecords--;
            collection.trigger('renderFinished', {
                length     : collection.totalRecords,
                currentPage: collection.currentPage,
                itemsNumber: collection.pageSize
            });

            self.showMoreContent(collection);
        });
    },

    showEditObjectiveDialog: function (model, duplicate) {
        var self = this;

        if (duplicate) {
            self.editObjectiveView = new EditObjectiveView({
                model      : model,
                duplicate  : duplicate,
                translation: this.translation
            });

            self.editObjectiveView.on('modelSaved', function (model) {
                self.collection.add(model, {merge: true});
                self.addReplaceRow(model);
            });
        } else {
            dataService.getData(this.contentType + '/' + model.get('_id'), {}, function (err, response) {
                if (err) {
                    return App.render({type: 'error', message: err.message});
                }

                self.editObjectiveView = new EditObjectiveView({
                    model      : response,
                    translation: self.translation
                });

                self.editObjectiveView.on('modelSaved', function (model) {
                    self.collection.add(model, {merge: true});
                    self.addReplaceRow(model);
                });

            });
        }
    },

    showAssignObjectiveDialog: function (model, multiselect, defFilter) {
        var self = this;

        this.assignObjectiveView = new CreateSubObjectivesView({
            model          : model,
            assign         : true,
            multiselect    : multiselect,
            assignDefFilter: defFilter,
            translation    : this.translation
        });
    },

    showSubObjectiveDialog: function (model, multiselect, defFilter) {
        var self = this;

        this.createSubObjectivesView = new CreateSubObjectivesView({
            model : model,
            multiselect : multiselect,
            assignDefFilter : defFilter,
            translation: this.translation
        });

        this.createSubObjectivesView.on('modelSaved', function () {
            self.collection.fetch({
                success : function () {
                    self.showMoreContent(self.collection);
                }
            });
        });
    },

    render: function () {
        var $currentEl = this.$el;
        var jsonCollection = this.collection.toJSON();
        var covered = App.currentUser && App.currentUser.covered || {};
        var $holder;

        $currentEl.html('');
        $currentEl.append('<div class="absoluteContent listnailsWrap"><div class="listnailsHolder scrollable"><div class="listTable"></div></div></div>');

        $holder = $currentEl.find('.listTable');
        $holder.append(this.template({
            collection : jsonCollection,
            translation: this.translation,
            tabName    : this.tabName,
            covered    : covered
        }));

        return this;
    },

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var $holder = $currentEl.find('.listTable');
        var jsonCollection = newModels.toJSON();
        var covered = App.currentUser && App.currentUser.covered || {};

        this.pageAnimation(this.collection.direction, $holder);

        $holder.empty();
        $holder.html(this.template({
            collection : jsonCollection,
            translation: this.translation,
            tabName    : this.tabName,
            covered    : covered
        }));
    }
});
