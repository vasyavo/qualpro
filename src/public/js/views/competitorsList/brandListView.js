var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Cookies = require('js-cookie');
var Template = require('../../../templates/competitorsList/create/brand/main.html');
var BrandTemplate = require('../../../templates/competitorsList/create/brand/header.html');
var BrandListTemplate = require('../../../templates/competitorsList/create/brand/list.html');
var NewBrandTemplate = require('../../../templates/competitorsList/create/brand/newRow.html');
var BrandModel = require('../../models/brand');
var BaseView = require('../../views/baseDialog');
var dataService = require('../../dataService');
var common = require('../../common');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var App = require('../../appState');

module.exports = BaseView.extend({
    contentType   : 'brandList',
    model         : BrandModel,
    brandsImgCache: {},

    template         : _.template(Template),
    brandTemplate    : _.template(BrandTemplate),
    brandListTemplate: _.template(BrandListTemplate),
    newBrandRow      : _.template(NewBrandTemplate),

    events: {
        'click .addBtn'                         : 'addNewRow',
        'click .flowSaveBtn'                    : 'saveItem',
        'click .flowCancelBtn'                  : 'cancelItem',
        'click .checkboxLabel'                  : 'checked',
        "click .listBody input[type='checkbox']": 'inputClick',
        'click .listBody tr'                    : 'rowClick',
        'click .editBtn, .deleteBtn'            : 'editDeleteChecked',
        'click #check_all_brand'                : 'checkAllBrand'
    },

    initialize: function (options) {

        this.translation = options.translation;
        this.currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
        this.anotherLanguage = (this.currentLanguage === 'en') ? 'ar' : 'en';
        this.makeRender(options);
        this.render();
    },

    checkAllBrand: function (e) {
        var $el = $(e.target);
        var $table = $el.closest('table');
        var $checkboxes = $table.find('input[type="checkbox"]:not(#check_all_brand)');
        var check = $el.prop("checked");

        if (this.editInProgress) {
            return e.preventDefault();
        }

        $checkboxes.prop("checked", check);
        this.inputClick(e);
    },

    checked: function (e) {
        e.stopPropagation();
    },

    editDeleteChecked: function (e) {
        var $target = $(e.target);
        var $contentHolder = $target.closest('.dialogBrandItem');
        var content = $contentHolder.attr('data-content');
        var $checkboxes = $contentHolder.find('input[type="checkbox"]:checked:not(#check_all_' + content + ')');
        var model = new this.model();
        var url = model.urlRoot() + '/remove/';
        var ids = [];
        var $item;
        var data;
        var id;
        var $row;
        var self = this;

        if (this.editInProgress) {
            return;
        }

        if ($target.hasClass('editBtn')) {
            $row = $checkboxes.closest('tr');
            $row.find('input').not($checkboxes).each(function (index, element) {
                var $element = $(element);

                $element.removeAttr('readonly');
                $element.attr('data-content', $element.val());
            });
            $row.addClass('editting');

            this.showHideButtons($contentHolder, {add: false, delete: false, edit: false});

            id = $checkboxes.attr('id');

            this.setFloatContainerPosition($contentHolder, $row, id);

            this.renderAvatar(id);
            this.showHideAvatar({avatar: true, upload: true, type: 'change'});
            $contentHolder.find('input[type="checkbox"]').attr('readonly', 'readonly');

            $row.addClass('clicked').siblings().removeClass('clicked');
            this.trigger('brandSelect', id);

            this.editInProgress = true;
            this.trigger('editInProgress', this.editInProgress);
        } else {
            $checkboxes.each(function (key, item) {
                $item = $(item);
                ids.push($item.attr('id'));
            });

            data = {
                ids     : ids,
                archived: true
            };

            dataService.putData(url, data, function (err) {
                if (err) {
                    return App.render({type: 'error', message: err.responseText});
                }

                var $rows = $checkboxes.closest('tr');

                $rows.remove();
                self.showHideButtons($contentHolder, {delete: false, edit: false});
                self.showHideAvatar({avatar: false});
                self.trigger('blockTables', -1);

                return App.render({
                    type   : 'notification',
                    message: content.capitalizer('firstCaps') + ' elements was deleted.'
                });
            });
        }
    },

    inputClick: function (e) {
        var $currentChecked = $(e.target);
        var $contentHolder = $currentChecked.closest('.dialogBrandItem');
        var $checkBoxes = $contentHolder.find('input[type="checkbox"]:checked:not(#check_all_brand)');
        var checkBoxesLength = $checkBoxes.length;
        var content = $contentHolder.attr('data-content');

        e.stopPropagation();

        if (this.editInProgress) {
            return e.preventDefault();
        }

        if (checkBoxesLength) {
            if (checkBoxesLength === 1) {
                this.showHideButtons($contentHolder, {edit: true, delete: true});
            } else {
                this.showHideButtons($contentHolder, {edit: false, delete: true});
            }
        } else {
            this.showHideButtons($contentHolder, {edit: false, delete: false});
        }
    },

    showHideButtons: function ($contentHolder, options) {
        var $btnHolder = $contentHolder.find('.brandButtonWrap');
        var $btn;
        var inputOptions = options || {};

        for (var key in
            inputOptions) {
            $btn = $btnHolder.find('.' + key + 'Btn');
            if (inputOptions[key]) {
                $btn.show();
            } else {
                $btn.hide();
            }
        }
    },

    showHideAvatar: function (options) {
        var opts = options || {};
        var $brandAvatar = this.$el.find('#brandAvatar');
        var $element;
        var key;

        for (key in opts) {
            if (key === 'type') {
                $element = $brandAvatar.find('.upload').find('p');
                $element.html(this.translation[opts[key] + 'Logo']);
            } else {
                $element = $brandAvatar.find('.' + key);

                if (opts[key]) {
                    $element.show();
                } else {
                    $element.hide();
                }
            }
        }
    },

    saveItem: function (e) {
        var $target = $(e.target);
        var $floatButtonsContainer = $target.closest('.floatButtonsContainer');
        var rowId = $floatButtonsContainer.attr('data-id');
        var $contentHolder = $target.closest('.dialogBrandItem');
        var $row = $contentHolder.find('#' + rowId).closest('tr');
        var $inputs = $row.find('input');
        var content = $contentHolder.attr('data-content');
        var model = new this.model();
        var dataObject = {};
        var self = this;
        var prevContent = this.getPrevContent(content);
        var prePrevContent;

        $inputs.each(function (index, element) {
            var $element = $(element);
            var value = $element.val();
            var keyAttr = $element.attr('data-key');
            var languageAttr = $element.attr('data-language');

            if (languageAttr) {
                dataObject[keyAttr] = dataObject[keyAttr] || {};
                dataObject[keyAttr][languageAttr] = value;
            } else {
                dataObject[keyAttr] = value;
            }
        });

        if (rowId === 'false') {
            delete dataObject._id;
        }

        if (prevContent) {
            dataObject[prevContent.content] = this[prevContent.content];
            if (content === 'item') {
                prePrevContent = this.getPrevContent(prevContent.content);
                dataObject[prePrevContent.content] = this[prePrevContent.content];
            }
        }

        dataObject.imageSrc = this.imageSrc;

        model.setFieldsNames(this.translation);

        model.save(dataObject, {
            patch  : true,
            wait   : true,
            success: function (model, response) {
                var id = model.id;
                var $checkbox = $row.find('input:checkbox');
                var $label = $row.find('label');

                $checkbox.attr('id', id);
                $checkbox.val(id);
                $checkbox.prop('checked', false);
                $label.attr('for', id);

                $row.removeClass('editting');

                $row.find('input').not($checkbox).attr('readonly', 'readonly');
                $row.find('.displayable').val(model.get('name').currentLanguage);
                self.showHideButtons($contentHolder, {add: true});
                $floatButtonsContainer.hide();

                self.showHideAvatar({upload: false});

                self.brandsImgCache[id] = model.get('imageSrc');
                $contentHolder.find('input[type="checkbox"]').removeAttr('readonly');

                self.trigger('brandSelect', id);

                self.editInProgress = false;
                self.trigger('editInProgress', self.editInProgress);
            },
            error  : function (model, xhr) {
                App.render(xhr.responseJSON);
            }
        });
    },

    cancelItem: function (e) {
        var $target = $(e.target);
        var $floatButtonsContainer = $target.closest('.floatButtonsContainer');
        var rowId = $floatButtonsContainer.attr('data-id');

        var $contentHolder = $target.closest('.dialogBrandItem');
        var $row = $contentHolder.find('#' + rowId).closest('tr');
        var $inputs;
        var content;
        var $checkbox;

        if (rowId !== 'false') {
            $checkbox = $row.find('input:checkbox');
            $inputs = $row.find('input:not([type="checkbox"])');
            content = $contentHolder.attr('data-content');

            $inputs.each(function (index, element) {
                var $element = $(element);
                var prevVal = $element.attr('data-content');

                $element
                    .attr('readonly', 'readonly')
                    .val(prevVal)
                    .attr('data-content', '');

                $row.removeClass('editting');

                $checkbox.prop('checked', false);
            });
        } else {
            $row.remove();

            this.trigger('blockTables', -1);
        }

        this.showHideButtons($contentHolder, {add: true});
        $contentHolder.find('input[type="checkbox"]').removeAttr('readonly');
        $floatButtonsContainer.hide();

        this.showHideAvatar({avatar: false});


        this.editInProgress = false;
        this.trigger('editInProgress', this.editInProgress);
    },

    setFloatContainerPosition: function ($contentHolder, $row, id) {
        var rowPosition;
        var scrollableContainerPosition;
        var rowHeight;
        var floatPosition;
        var $scrollableContainer = $contentHolder.find('.mCSB_container');
        var $floatButtonsContainer = $contentHolder.find('.floatButtonsContainer');

        rowPosition = $row.position();
        rowHeight = $row.height();
        scrollableContainerPosition = $scrollableContainer.position();

        if (id) {
            floatPosition = scrollableContainerPosition.top + rowPosition.top + rowHeight - $floatButtonsContainer.height() / 2;
        } else {
            floatPosition = rowHeight - $floatButtonsContainer.height() / 2;
        }
        $floatButtonsContainer.css({top: floatPosition});
        $floatButtonsContainer.attr('data-id', id);
        $floatButtonsContainer.show();
    },

    addNewRow: function (e) {
        var $target = $(e.target);
        var $contentHolder = $target.closest('.dialogBrandItem');
        var content = $contentHolder.attr('data-content');
        var template = this.newBrandRow;
        var $newRow = $(template({
            currentLanguage: this.currentLanguage,
            anotherLanguage: this.anotherLanguage,
            translation    : this.translation
        }));

        if (this.editInProgress) {
            return;
        }

        $contentHolder.find('.listBody').prepend($newRow);
        $contentHolder.find('.scrollable').mCustomScrollbar('scrollTo', 'top');
        this.setFloatContainerPosition($contentHolder, $newRow, false);
        this.showHideButtons($contentHolder, {add: false, delete: false, edit: false});

        common.canvasDrawing({}, this);
        $contentHolder.find('input[type="checkbox"]').attr('readonly', 'readonly');
        this.showHideAvatar({avatar: true, upload: true, type: 'add'});

        $newRow.addClass('clicked').siblings().removeClass('clicked');

        this.editInProgress = true;
        this.trigger('editInProgress', this.editInProgress);
    },

    renderTable: function (options) {
        var $container = options.element || this.$el;
        var name = options.name;
        var template;

        if (name) {
            template = this.brandTemplate;

            $container
                .find('#' + name + 'Holder')
                .html('')
                .addClass('tableBlocked')
                .append(template({
                        title      : this.translation[name],
                        translation: this.translation
                    })
                );
        }
    },

    renderTableList: function (options) {
        var $curEl = this.$el;
        var name = options.name;
        var template = this.brandListTemplate;
        var data = options.data || [];
        var $contentHolder = $curEl.find('#' + name + 'Holder');

        $contentHolder
            .removeClass('tableBlocked')
            .find('.listBody')
            .html('')
            .append(template({
                    items          : data,
                    currentLanguage: this.currentLanguage,
                    anotherLanguage: this.anotherLanguage,
                    translation    : this.translation
                })
            );

        this.showHideButtons($contentHolder, {add: true, delete: false, edit: false});
    },

    renderAvatar: function (id) {
        var $thisEl = this.$el;
        var options = {};

        if (id && id !== 'false') {
            options.model = {
                imageSrc: this.brandsImgCache[id]
            };
        }

        common.canvasDrawing(options, this);
    },

    getNextContent: function (content) {
        /* var array = this.tablesArray;
         var curContentIndex = array.indexOf(content);
         var nextContentIndex = curContentIndex + 1;
         var nextContent = array[nextContentIndex]

         if (nextContent) {
         return {content: nextContent, index: nextContentIndex};
         }

         return false;*/
    },

    getPrevContent: function (content) {
        /* var array = this.tablesArray;
         var curContentIndex = array.indexOf(content);
         var prevContentIndex = curContentIndex - 1;
         var prevContent = array[prevContentIndex]

         if (prevContent) {
         return {content: prevContent, index: prevContentIndex};
         }

         return false;*/
    },

    rowClick: function (e) {
        var $target = $(e.target);
        var $row = $target.closest('tr');
        var $checbox = $row.find('input[type="checkbox"]');
        var rowId = $checbox.attr('id');

        if (this.editInProgress) {
            return;
        }

        $row.addClass('clicked').siblings().removeClass('clicked');

        if ($row.hasClass('editting')) {
            return this.showHideAvatar({avatar: true, upload: true});
        }

        this.renderAvatar(rowId);
        this.showHideAvatar({avatar: true, upload: false});

        this.trigger('brandSelect', rowId);
    },

    render: function () {
        var $formString = $(this.template({
            translation: this.translation
        }));
        var self = this;
        var currentLanguage = App.currentUser.currentLanguage;


        dataService.getData('/brand/', {archived: 'false', count: -1}, function (err, result) {
            var data;

            if (err) {
                return App.render({type: 'error', message: ERROR_MESSAGES.canNotGetBrands[currentLanguage]});
            }

            data = result.data;

            _.map(data, function (brand) {
                if (brand.name !== null && typeof brand.name === 'object' && (brand.name.en || brand.name.ar)) {
                    brand.name.currentLanguage = brand.name[self.currentLanguage] || brand.name[self.anotherLanguage];
                }

                self.brandsImgCache[brand._id] = brand.imageSrc;
            });

            self.renderTableList({name: 'brand', data: data});
        });

        this.renderTable({name: 'brand', element: $formString});

        this.$el.html($formString);

        common.canvasDraw({translation: this.translation.crop || {}}, this);

        this.delegateEvents(self.events);

        return this;
    }
});
