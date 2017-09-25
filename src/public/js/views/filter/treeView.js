var $ = require('jquery');
var _ = require('underscore');
var template = require('../../../templates/filter/treeTemplate.html');
var baseDialog = require('../../views/baseDialog');
var dataService = require('../../dataService');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var App = require('../../appState');

module.exports = baseDialog.extend({
    contentType  : 'Tree',
    imageSrc     : '',
    template     : _.template(template),
    selectedNodes: [],
    location     : null,
    tree         : [],
    indexes      : {
        1: 'country',
        2: 'region',
        3: 'subRegion',
        4: 'branch'
    },

    events: {},

    initialize: function (options) {
        options = options || {};
        this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';

        var data = {
            currentLanguage: this.currentLanguage,
            ids            : options.ids
        };
        var self = this;
        this.translation = options.translation;

        this.instoreObjective = options.instoreObjective;

        if (this.instoreObjective) {
            this.selectedPersonnelLevel = options.selectedLevel;
            if (this.selectedPersonnelLevel > 5) {
                this.selectedPersonnelLevel = 5;
            }
            data.instoreObjective = true;
        }

        dataService.getData('/personnel/getForTree', data, function (err, res) {
            if (err) {
                return App.render(err);
            }

            self.tree = res;

            self.makeRender();
            self.render();
        });

        self.getSelectedOnInit.bind(self);
    },

    sortDataByContentType: function () {
        var data = {
            country      : [],
            region       : [],
            subRegion    : [],
            retailSegment: [],
            outlet       : [],
            branch       : []
        };
        var element;
        var i = this.selectedNodes.length - 1;

        for (i; i >= 0; i--) {
            element = this.selectedNodes[i];

            if (data[element.contentType]) {
                data[element.contentType].push(element);
            }
        }

        return data;
    },

    getLocation: function (location) {
        var locationString;
        var country;
        var region;
        var subRegion;
        var retailSegment;
        var outlet;
        var branch;
        for (var key in location) {
            location[key] = _.map(location[key], function (item) {
                return item.title;
            });
        }

        country = location.country.length ? location.country.join(', ') : '';
        region = location.region.length ? ' > ' + location.region.join(', ') : '';
        subRegion = location.subRegion.length ? ' > ' + location.subRegion.join(', ') : '';
        retailSegment = location.retailSegment.length ? ' > ' + location.retailSegment.join(', ') : '';
        outlet = location.outlet.length ? ' > ' + location.outlet.join(', ') : '';
        branch = location.branch.length ? ' > ' + location.branch.join(', ') : '';

        locationString = country + region + subRegion + retailSegment + outlet + branch;

        return locationString || ERROR_MESSAGES.locationNotSelected[this.currentLanguage];
    },

    getSelectedOnInit: function (tree) {
        var self = this;
        var sortedData;

        self.selectedNodes = [];

        tree.visit(function (node) {
            if (node.partsel || node.selected) {
                self.selectedNodes.push({
                    _id        : node.data._id,
                    title      : node.title,
                    contentType: node.data.contentType
                });
            }
        });

        sortedData = self.sortDataByContentType();

        self.location = self.getLocation(sortedData);
        self.$el.find('#location').text(self.location);
    },

    save: function () {
        var data = this.sortDataByContentType();
        var currentUser = App.currentUser;
        var currentLevel = currentUser.accessRole ? currentUser.accessRole.level : null;
        var currentLanguage = currentUser.currentLanguage;
        for (var key in data) {
            data[key] = _.pluck(data[key], '_id');
        }

        if (this.instoreObjective) {

            if (this.selectedPersonnelLevel !== 1) {
                if (!this.indexes[this.selectedPersonnelLevel - 1]) {
                    return App.render({
                        type   : 'error',
                        message: ERROR_MESSAGES.locationNotSelected[currentLanguage]
                    });
                }

                if (data[this.indexes[this.selectedPersonnelLevel - 1]].length === 0) {
                    return App.render({
                        type   : 'error',
                        message: ERROR_MESSAGES.locationNotSelected[currentLanguage]
                    });
                }
            }

        } else {
            if (!this.indexes[currentLevel]) {
                return App.render({type: 'error', message: ERROR_MESSAGES.locationNotSelected[currentLanguage]});

            }
            if (data[this.indexes[currentLevel]].length === 0) {
                return App.render({type: 'error', message: ERROR_MESSAGES.locationNotSelected[currentLanguage]});
            }
        }

        data.location = this.location;

        this.trigger('locationSelected', data);

        return true;
    },

    render: function () {
        var self = this;
        var responseForMasterAdmin = {
            country      : [],
            region       : [],
            subRegion    : [],
            retailSegment: [],
            outlet       : [],
            branch       : [],
            location     : 'Location not selected'
        };

        if (this.instoreObjective && this.selectedPersonnelLevel === 1 || !self.tree.length) {
            return this.trigger('locationSelected', responseForMasterAdmin);
        }

        this.$el.html(this.template({
            translation: this.translation
        }));

        this.$el = this.$el.dialog({
            closeOnEscape: false,
            dialogClass  : 'treeDialog',
            title        : 'Preview Location',
            showCancelBtn: false,
            buttons      : {
                save: {
                    text : this.translation.okBtn,
                    click: function () {
                        var close = self.save();

                        if (close) {
                            $(this).dialog('destroy').remove();
                        }
                    }
                }
            }
        });

        $('#tree').fancytree({
            source      : this.tree,
            checkbox    : true,
            selectMode  : 3,
            keyboard    : false,
            icon        : false,
            init        : function (e, data) {
                var tree = $(this).fancytree('getTree');

                self.getSelectedOnInit(tree);
            },
            beforeSelect: function (e, data) {
                var tree = $(this).fancytree('getTree');
                var nodeChecked = data.node;
                var currentLocationNodeValue = self.indexes[self.selectedPersonnelLevel - 1];

                if (self.instoreObjective) {

                    if (nodeChecked && nodeChecked.data && nodeChecked.data.contentType !== currentLocationNodeValue) {
                        return false;
                    }

                    tree.visit(function (node) {
                        if (node.partsel || node.selected) {
                            node._changeSelectStatusAttrs(false);
                        }
                    });
                }
            },
            select      : function (e, data) {
                var tree = $(this).fancytree('getTree');

                self.getSelectedOnInit(tree);
            }
        });

        this.delegateEvents(this.events);

        return this;
    }
});
