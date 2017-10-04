var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var async = require('async');
var BaseView = require('../../views/baseDialog');
var CreateTemplate = require('../../../templates/domain/create.html');
var NewThumbnail = require('../../../templates/domain/newThumbnail.html');
var NewRow = require('../../../templates/domain/newRow.html');
var common = require('../../common');
var populate = require('../../populate');
var implementShowHideArabicInputIn = require('../../helpers/implementShowHideArabicInputIn');
var dataService = require('../../dataService');
var App = require('../../appState');

module.exports = BaseView.extend({
    template            : _.template(CreateTemplate),
    templateNewRow      : _.template(NewRow),
    templateNewThumbnail: _.template(NewThumbnail),
    imageSrc            : '',

    events: {
        click                                                             : 'hideNewSelect',
        'click .currentSelected'                                          : 'showNewSelect',
        'click .newSelectList li:not(.miniStylePagination)'               : 'chooseOption',
        'click .newSelectList li.miniStylePagination'                     : 'notHide',
        'click .newSelectList li.miniStylePagination .next:not(.disabled)': 'nextSelect',
        'click .newSelectList li.miniStylePagination .prev:not(.disabled)': 'prevSelect'
    },

    initialize: function (options) {
        var getters;
        var self = this;
        this.parentId = options.parentId;
        this.translation = options.translation;
        if (options.subRegionId) {
            this.subRegionId = options.subRegionId.substr(0, 24);
        }
        if (options.retailSegmentId) {
            this.retailSegmentId = options.retailSegmentId.substr(0, 24);
            getters = {};
            getters.retailSegment = function (callback) {
                dataService.getData('/retailSegment/' + self.retailSegmentId, {}, callback);
            };
        }

        if (options.outletId) {
            this.outletId = options.outletId.substr(0, 24);
            getters = getters || {};
            getters.outlet = function (callback) {
                dataService.getData('/outlet/' + self.outletId, {}, callback);
            };
        }

        this.contentType = options.contentType;
        this.Model = options.Model || Backbone.Model.extend({});
        this.responseObj = {};
        _.bindAll(this, 'saveItem');
        this.model = new this.Model();

        if (getters) {
            async.parallel(getters, function (err, resp) {
                if (resp.retailSegment) {
                    self.retailSegmentName = resp.retailSegment.name.en;
                }

                if (resp.outlet) {
                    self.outletName = resp.outlet.name.en;
                }

                self.makeRender();
                self.render();

            });
        } else {
            this.makeRender();
            this.render();
        }

    },

    saveItem: function () {
        var self = this;
        var model = new this.Model();
        var $currEl = this.$el;
        var nameEn = $.trim($currEl.find('#nameEn').val());
        var nameAr = $.trim($currEl.find('#nameAr').val());
        var hasAddress = this.contentType === 'branch';
        var hasLinkToMap = this.contentType === 'branch';
        var hasManager = this.contentType === 'branch';
        var hasCurrency = this.contentType === 'country';
        var hasRetailSegment = this.contentType === 'branch';
        var hasOutlet = this.contentType === 'branch';

        var saveData = {
            name    : {en: nameEn, ar: nameAr},
            imageSrc: this.imageSrc,
            type    : this.contentType
        };

        if (this.subRegionId) {
            saveData.subRegion = this.subRegionId;
        }

        if (hasCurrency) {
            saveData.currency = $currEl.find('#currencyDd').attr('data-id');
        }

        if (hasAddress) {
            saveData.address = {
                en: $.trim($currEl.find('#addressEn').val()),
                ar: $.trim($currEl.find('#addressAr').val())
            };
        }

        if (hasLinkToMap) {
            saveData.linkToMap = $.trim($currEl.find('#linkToMap').val());
        }

        if (hasManager) {
            saveData.manager = $currEl.find('#personnelDd').attr('data-id');
        }

        if (this.parentId) {
            saveData.parentId = this.parentId;
        }

        if (hasRetailSegment) {
            saveData.retailSegment = $currEl.find('#retailSegmentDd').attr('data-id');
        }

        if (hasOutlet) {
            saveData.outlet = $currEl.find('#outletDd').attr('data-id');
        }

        saveData.contentType = this.contentType;

        model.setFieldsNames(this.translation, saveData);

        model.save(saveData,
            {
                wait   : true,
                success: function (data) {
                    self.hideDialog();
                    self.trigger('modelSaved', data);
                },
                error  : function (model, xhr) {
                    var errorText = xhr.responseJSON.description;
                    var currentLanguage = App.currentUser.currentLanguage;

                    App.render({type: 'error', message: errorText[currentLanguage]});
                }
            });
    },

    hideDialog: function () {
        $('.edit-dialog').remove();
        $('.add-group-dialog').remove();
        $('.add-user-dialog').remove();
        $('.crop-images-dialog').remove();
    },

    render: function () {
        var jsonModel = this.model.toJSON();

        var formString = this.template({
            contentType      : this.contentType,
            outletName       : this.outletName,
            outletId         : this.outletId,
            retailSegmentName: this.retailSegmentName,
            retailSegmentId  : this.retailSegmentId,
            translation      : this.translation,
            App: App,
        });
        var self = this;

        var hasCurrency = this.contentType === 'country';
        var hasManager = this.contentType === 'branch';
        var hasRetailSegment = this.contentType === 'branch';
        var hasOutlet = this.contentType === 'branch';
        var $thisEl;

        this.$el = $(formString).dialog({
            dialogClass: 'edit-dialog',
            title      : 'Create New Country',
            buttons    : {
                save  : {
                    text : this.translation.createBtn,
                    class: 'btn createBtn',
                    click: function () {
                        self.saveItem();
                    }
                },
                cancel: {
                    text: this.translation.cancelBtn
                }
            }
        });

        $thisEl = this.$el;

        common.canvasDraw({model: this.model.toJSON(), translation: this.translation.crop || {}}, this);
        implementShowHideArabicInputIn(this);

        if (hasCurrency) {
            populate.inputDropDown({
                selector    : '#currencyDd',
                context     : this,
                contentType : 'currency',
                displayModel: jsonModel.currency,
                displayText : this.translation.currencyPH
            });
        }

        if (hasOutlet && !this.outletId) {
            populate.inputDropDown({
                selector    : '#outletDd',
                context     : this,
                contentType : 'outlet',
                displayModel: jsonModel.outlet,
                displayText : this.translation.labelOutlet
            });
        }

        if (hasRetailSegment && !this.retailSegmentId) {
            populate.inputDropDown({
                selector    : '#retailSegmentDd',
                context     : this,
                contentType : 'retailSegment',
                displayModel: jsonModel.retailSegment,
                displayText : this.translation.labelRetSegment
            });
        }

        if (hasManager) {
            populate.inputDropDown({
                selector      : '#personnelDd',
                context       : this,
                contentType   : 'personnel',
                displayModel  : jsonModel.manager,
                displayText   : this.translation.labelManager,
                singleUnselect: true
            });

            this.on('changeItem', function (item) {
                $thisEl.find('#mobile').inputmask('+999(99)-999-9999');
                $thisEl.find('#mobile').val(item.model.phoneNumber);
                $thisEl.find('#email').val(item.model.email);
            });

            if (jsonModel.manager) {
                this.trigger('changeItem', {model: jsonModel.manager});
            }

        }

        this.delegateEvents(this.events);

        return this;
    }
});
