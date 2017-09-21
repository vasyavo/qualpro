var $ = require('jquery');
var _ = require('underscore');
var CreateTemplate = require('../../../templates/personnel/create.html');
var BaseView = require('../../views/baseDialog');
var Model = require('../../models/personnel');
var common = require('../../common');
var populate = require('../../populate');
var implementShowHideArabicInputIn = require('../../helpers/implementShowHideArabicInputIn');
var createPersonnelViewLogic = require('../../helpers/createPersonnelViewLogic');
var App = require('../../appState');

module.exports = BaseView.extend({
    contentType: 'personnel',

    template: _.template(CreateTemplate),
    imageSrc: '',

    events: {
        'mouseenter .avatar'         : 'showEdit',
        'mouseleave .avatar'         : 'hideEdit',
        'click .currentSelected'     : 'showNewSelect',
        'click'                      : 'hideNewSelect',
        'click .newSelectList'       : 'chooseOption',
        'click .domainDialogExecutor': 'showDomainDialog'

    },

    initialize: function (options) {
        _.bindAll(this, 'saveItem');

        this.model = new Model();
        this.logic = createPersonnelViewLogic(this);
        this.responseObj = {};

        this.translation = options.translation;

        //todo review this logic according to multidomain opportunities
        if (options && options.hasOwnProperty('countryId')) {
            this.model.set('country', options.countryId);
        }
        this.makeRender();
        this.render();
    },

    saveItem: function () {
        var personnelModel = new Model();

        this.logic.getDataFromHtmlAndSaveModel(personnelModel, this.imageSrc, this.translation);
    },

    hideDialog: function () {
        $('.edit-dialog').remove();
        $('.add-group-dialog').remove();
        $('.add-user-dialog').remove();
        $('.crop-images-dialog').remove();
    },

    showDomainDialog: function (e) {
        var domainType = $(e.target).attr('data-value');

        this.logic.showDomainDialog(domainType);
    },

    dropDownSelected: function (opts) {
        if (opts.contentType === 'accessRole') {
            this.accessRoleSelected(opts);
        }
    },

    accessRoleSelected: function (opts) {
        var model = opts.model;

        this.logic.showDomainsRows(model.level);
    },

    render: function () {
        var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
        var firstNameIdToHide = 'firstName' + anotherLanguage;
        var lastNameIdToHide = 'lastName' + anotherLanguage;
        var jsonModel = this.model.toJSON();
        var formString = this.template({
            translation: this.translation,
            App: App,
        });
        var self = this;
        var $curEl;
        var $phoneField;

        this.$el = $(formString).dialog({
            dialogClass: 'edit-dialog',
            //TODO Remove width in personnel createView
            width      : '1150',
            title      : this.translation.createPersonnel,
            buttons    : {
                save: {
                    text : self.translation.createBtn,
                    class: 'btn',
                    click: function () {
                        self.saveItem();
                    }
                }
            }
        });

        $curEl = this.$el;

        $curEl.find('#' + firstNameIdToHide).hide();
        $curEl.find('#' + lastNameIdToHide).hide();

        $phoneField = $curEl.find('#phone');
        $phoneField.inputmask('+999(99)-999-9999');
        $phoneField.attr('data-inputmask-clearmaskonlostfocus', false);
        $phoneField.attr('data-masked', true);

        populate.inputDropDown({
            selector   : '#accessRoleDd',
            context    : this,
            contentType: 'accessRole'
        });

        populate.inputDropDown({
            selector   : '#positionDd',
            context    : this,
            contentType: 'position'
        });

        this.on('changeItem', this.dropDownSelected, this);

        $curEl.find('#dateJoined').datepicker({
            changeMonth: true,
            changeYear : true,
            yearRange  : '-20y:c+10y',
            maxDate    : new Date(),
            defaultDate: new Date()
        });

        common.canvasDraw({
            model      : this.model.toJSON(),
            translation: this.translation
        }, this);

        implementShowHideArabicInputIn(this);

        this.logic.cacheDomainFields();
        this.logic.clearAndHideDomainFieldsAfter('country');
        this.logic.showDomainsRows(1);
        this.delegateEvents(this.events);

        return this;
    }
});
