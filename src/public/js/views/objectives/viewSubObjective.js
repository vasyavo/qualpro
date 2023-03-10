var $ = require('jquery');
var _ = require('underscore');
var paginator = require('../../views/paginator');
var ViewTemplate = require('../../../templates/objectives/viewSubObjectives.html');
var NewRow = require('../../../templates/objectives/list/newRow.html');
var PreViewSub = require('../../views/objectives/preView/preView');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = paginator.extend({
    contentType: CONTENT_TYPES.OBJECTIVES,
    template   : _.template(ViewTemplate),
    templateNew: _.template(NewRow),
    events     : {
        'click .listRow': 'listRowClick'
    },

    initialize: function (options) {
        this.collection = options.collection;
        this.translation = options.translation;
        options.contentType = this.contentType;

        this.makeRender(options);
        this.render();
    },

    listRowClick: function (e) {
        var self = this;
        var targetEl = $(e.target);
        var targetRow = targetEl.closest('.listRow');
        var id = targetRow.attr('data-id');
        var model = this.collection.get(id);


        this.preView = new PreViewSub({
            model       : model,
            translation : this.translation,
            activityList: true
        });
        this.preView.on('modelSaved', function (model) {
            self.collection.add(model, {merge: true});
            self.addReplaceRow(model);
        });
    },

    render: function () {
        var self = this;
        var $formString = $(this.$el);
        var jsonCollection = this.collection.toJSON();

        $formString.html(this.template({
            collection : jsonCollection,
            translation: this.translation
        }));

        this.$el = $formString.dialog({
            dialogClass  : 'create-dialog',
            width        : '1000',
            showCancelBtn: false,
            buttons      : {
                save: {
                    text : self.translation.okBtn,
                    class: 'btn saveBtn objectiveClose',
                    click: function () {
                        self.undelegateEvents();
                        self.$el.dialog('close').dialog('destroy').remove();
                    }
                }
            }
        });

        this.delegateEvents(this.events);

        return this;
    }
});
