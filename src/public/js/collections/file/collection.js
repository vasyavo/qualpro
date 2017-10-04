var _ = require('underscore');
var Parent = require('../../collections/parrent');
var Model = require('../../models/file');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    viewType   : null,
    contentType: CONTENT_TYPES.FILES,

    initialize: function (jsonModels, selected) {
        selected = !!selected;
        jsonModels = jsonModels || [];

        this.setAndUpdateModels(jsonModels, selected);
    },

    setAndUpdateModels: function (jsonModels, selected) {
        var self = this;
        if (Array.isArray(jsonModels)) {
            jsonModels.forEach(function (jsonModel) {
                var model = new self.model;

                model.update({file: jsonModel, uploaded: true, selected: selected});
                self.add(model);
            });
        } else {
            var model = new self.model;

            model.update({file: jsonModels, uploaded: true, selected: selected});
            self.add(model);
        }
    },

    getSelected: function (options) {
        var data;
        var selectedModels;

        options = options || {};
        data = {
            models  : options.models,
            selected: options.selected
        };

        selectedModels = _.filter(data.models || this.models, function (model) {
            if (data.selected) {
                return model.get('selected');
            }

            return !model.get('selected');
        });

        return selectedModels;
    },

    getUploaded: function (options) {
        var data;
        var uploadedModels;

        options = options || {};
        data = {
            models  : options.models,
            uploaded: options.uploaded
        };

        uploadedModels = _.filter(data.models || this.models, function (model) {
            if (data.uploaded) {
                return model.get('uploaded');
            }

            return !model.get('uploaded');
        });

        return uploadedModels;
    },

    getParent: function (options) {
        var data;
        var parentModels;

        options = options || {};
        data = {
            json  : options.json,
            models: options.models,
            parent: options.parent
        };

        parentModels = _.filter(data.models || this.models, function (model) {
            if (data.parent) {
                return model.get('uploaded');
            }

            return !model.get('uploaded');
        });

        if (!data.json) {
            return parentModels;
        }

        return _.map(parentModels, function (model) {
            var id = model.get('document');
            if (id) {
                model.set({_id: id})
            }
            return model.toJSON();
        });
    }
});
