var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var async = require('async');
var BaseView = require('../../views/baseDialog');
var EditTemplate = require('../../../templates/domain/edit.html');
var NewThumbnail = require('../../../templates/domain/newThumbnail.html');
var NewRow = require('../../../templates/domain/newRow.html');
var common = require('../../common');
var populate = require('../../populate');
var implementShowHideArabicInputIn = require('../../helpers/implementShowHideArabicInputIn');
var dataService = require('../../dataService');
var App = require('../../appState');

module.exports = BaseView.extend({
    template            : _.template(EditTemplate),
    templateNewRow      : _.template(NewRow),
    templateNewThumbnail: _.template(NewThumbnail),
    imageSrc            : '',

    events: {
        'click .showHideAr, .showHideTranslation': 'showHideArabicInput'
    },

    initialize: function (options) {
        var getters;
        var self = this;
        this.viewType = options.viewType;
        this.parentId = options.parentId;
        this.subRegionId = options.subRegionId;
        this.model = options.model;
        this.translation = options.translation;

        this.contentType = options.contentType;
        this.responseObj = {};
        _.bindAll(this, 'saveItem');

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

    hideDialog: function () {
        $('.edit-dialog').remove();
        $('.add-group-dialog').remove();
        $('.add-user-dialog').remove();
        $('.crop-images-dialog').remove();
    },

    saveItem: function () {
        var self = this;
        var model = this.model;
        var _id = model.get('_id');
        var currEl = this.$el;
        var name = model.get('name');
        var address = model.get('address');
        var nameEn = $.trim(currEl.find('#nameEn').val());
        var nameAr = $.trim(currEl.find('#nameAr').val());
        var hasAddress = this.contentType === 'branch';
        var hasLinkToMap = this.contentType === 'branch';
        var hasManager = this.contentType === 'branch';
        var hasCurrency = this.contentType === 'country';
        var hasRetailSegment = this.contentType === 'branch';
        var hasOutlet = this.contentType === 'branch';
        var currency;
        var addressEn;
        var addressAr;
        var linkToMap;
        var manager;
        var modelManager;
        var retailSegment;
        var modelCurrency;
        var modelRetailSegment;
        var modelOutlet;
        var outlet;
        var saveData = {};

        if (name.en !== nameEn || name.ar !== nameAr) {
            saveData.name = {
                en: nameEn,
                ar: nameAr
            };
        }

        if (this.imageSrc && this.imageSrc !== model.get('imageSrc')) {
            saveData.imageSrc = this.imageSrc;
        }

        if (this.subRegionId && this.subRegionId !== model.get('subRegion')._id) {
            saveData.subRegion = this.subRegionId;
        }

        if (hasCurrency) {
            currency = currEl.find('#currencyDd').attr('data-id');
            modelCurrency = model.get('currency');
            if (currency !== (modelCurrency && modelCurrency._id ? modelCurrency._id : modelCurrency)) {
                saveData.currency = currency;
            }
        }

        if (hasAddress) {
            addressEn = $.trim(currEl.find('#addressEn').val());
            addressAr = $.trim(currEl.find('#addressAr').val());
            if (addressAr !== address.ar || addressEn !== address.en) {
                saveData.address = {
                    en: addressEn,
                    ar: addressAr
                };
            }
        }

        if (hasLinkToMap) {
            linkToMap = $.trim(currEl.find('#linkToMap').val());
            if (linkToMap !== model.get('linkToMap')) {
                saveData.linkToMap = linkToMap;
            }
        }

        if (hasManager) {
            manager = currEl.find('#personnelDd').attr('data-id') ? currEl.find('#personnelDd').attr('data-id') : null;
            modelManager = model.get('manager');
            if (manager !== (modelManager && modelManager._id ? modelManager._id : modelManager)) {
                if (manager !== model.get('manager')) {
                    saveData.manager = manager;
                }
            }
        }

        if (hasRetailSegment) {
            retailSegment = currEl.find('#retailSegmentDd').attr('data-id');
            modelRetailSegment = model.get('retailSegment');
            if (retailSegment !== (modelRetailSegment && modelRetailSegment._id ? modelRetailSegment._id : modelRetailSegment)) {
                saveData.retailSegment = retailSegment;
            }
        }

        if (hasOutlet) {
            outlet = currEl.find('#outletDd').attr('data-id');
            modelOutlet = model.get('outlet');
            if (outlet !== (modelOutlet && modelOutlet._id ? modelOutlet._id : modelOutlet)) {
                saveData.outlet = outlet;
            }
        }

        if (!Object.keys(saveData).length) {
            return self.hideDialog();
        }

        model.setFieldsNames(this.translation, saveData);

        saveData.type = this.contentType;

        model.save(saveData,
            {
                patch  : true,
                wait   : true,
                success: function (data) {
                    var jsonData = data.toJSON();

                    self.hideDialog();

                    if (self.contentType === 'branch' && (jsonData.outlet._id !== modelOutlet._id || jsonData.retailSegment._id !== modelRetailSegment._id)) {
                        return $('.thumbnailsItems div[data-id="' + _id + '"]').remove();
                    }

                    self.trigger('modelSaved', data);
                },
                error  : function (err, xhr) {
                    App.renderErrors(xhr.responseText);
                }
            });
    },

    render: function () {
        var jsonModel = this.model.toJSON();
        var formString = this.template({
            model      : jsonModel,
            contentType: this.contentType,
            translation: this.translation,
            App        : App,
        });
        var self = this;
        var $thisEl;

        var hasCurrency = this.contentType === 'country';
        var hasManager = this.contentType === 'branch';
        var hasRetailSegment = this.contentType === 'branch';
        var hasOutlet = this.contentType === 'branch';
        var hasImage = this.contentType !== 'branch';

        this.$el = $(formString).dialog({
            dialogClass: 'edit-dialog',
            title      : 'Create New Country',
            buttons    : {
                save  : {
                    text : this.translation.saveBtn,
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

        if (hasImage) {
            common.canvasDraw({model: jsonModel}, this);
        }

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
                displayModel: jsonModel.outlet
            });
        }

        if (hasRetailSegment && !this.retailSegmentId) {
            populate.inputDropDown({
                selector    : '#retSegmentDd',
                context     : this,
                contentType : 'retailSegment',
                displayModel: jsonModel.retailSegment,
                displayText : 'Trade channel'
            });
        }

        if (hasManager) {
            populate.inputDropDown({
                selector      : '#personnelDd',
                context       : this,
                contentType   : 'personnel',
                displayModel  : jsonModel.manager,
                displayText   : 'manager',
                singleUnselect: true
            });

            this.on('changeItem', function (item) {
                $thisEl.find('#mobile').inputmask('+999(99)-999-9999').val(item.model.phoneNumber);
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
