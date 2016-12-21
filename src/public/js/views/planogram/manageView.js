define([
    'jQuery',
    'Underscore',
    'async',
    'text!templates/planogram/manage.html',
    'text!templates/planogram/manage/configurations/header.html',
    'text!templates/planogram/manage/configurations/list.html',
    'text!templates/planogram/manage/configurations/newRow.html',
    'text!templates/planogram/manage/retailSegment/header.html',
    'text!templates/planogram/manage/retailSegment/list.html',
    'views/baseDialog',
    'models/planogram',
    'collections/retailSegment/collection',
    'dataService',
    'constants/contentType',
    'constants/errorMessages'
], function ($, _, async, ManageTemplate, ConfigurationTemplate, ConfigurationListTemplate,
             NewConfigurationTemplate, RetailSegmentTemplate, RetailSegmentListTemplate, BaseView,
             Model, retailSegmentCollection, dataService, CONTENT_TYPES, ERROR_MESSAGES) {

    var manageView = BaseView.extend({
        contentType: CONTENT_TYPES.PLANOGRAM,

        template                 : _.template(ManageTemplate),
        configurationTemplate    : _.template(ConfigurationTemplate),
        configurationListTemplate: _.template(ConfigurationListTemplate),
        newConfigurationTemplate : _.template(NewConfigurationTemplate),
        retailSegmentTemplate    : _.template(RetailSegmentTemplate),
        retailSegmentListTemplate: _.template(RetailSegmentListTemplate),

        events: {
            'click .retailSegmentRow'               : 'showConfigurations',
            'click .addBtn'                         : 'addNewRow',
            'click .flowCancelBtn'                  : 'cancelItem',
            'click .flowSaveBtn'                    : 'saveItem',
            "click .listBody input[type='checkbox']": 'inputClick',
            'click .editBtn'                        : 'editChecked',
            'click .deleteBtn'                      : 'deleteChecked',
            'click #checkAll'                       : 'checkAll'
        },

        initialize: function (options) {
            this.translation = options.translation;
            this.collection = new retailSegmentCollection({reset: true, page: 'All'});
            this.makeRender();
            this.collection.bind('reset', function () {
                this.render();
            }, this);
        },

        checkAll: function (e) {
            var $el = $(e.target);
            var $table = $el.closest('table');
            var $checkboxes = $table.find('input[type="checkbox"]:not(#checkAll)');
            var check = $el.prop('checked');

            $checkboxes.prop('checked', check);
            this.inputClick(e);
        },

        editChecked: function (e) {
            var $target = $(e.target);
            var $contentHolder = $target.closest('.dialogCategoryItem');
            var content = $contentHolder.attr('data-content');
            var $checkboxes = $contentHolder.find('input[type="checkbox"]:checked');
            var $inputs = $checkboxes.closest('tr').find('input:not([type="checkbox"])');
            var $dialog = this.$el;
            var $row;
            var $editRow;
            var data;

            $row = $inputs.closest('tr');
            $contentHolder.find('input[type="checkbox"]').attr('readonly', 'readonly');

            $inputs.each(function (index, input) {
                var $input = $(input);

                $input.removeAttr('readonly');
                $input.attr('data-content', $input.val());
            });

            $row.addClass('editting');
            this.showHideButtons($contentHolder, {add: false, delete: false, edit: false});
            this.setFloatContainerPosition($contentHolder, $row, $checkboxes.attr('id'));

            $editRow = $contentHolder.find('.editable');
        },

        deleteChecked: function (e) {
            var $target = $(e.target);
            var $contentHolder = $target.closest('.dialogCategoryItem');
            var content = $contentHolder.attr('data-content');
            var $checkboxes = $contentHolder.find('input[type="checkbox"]:checked');
            var configurationIds = [];
            var $item;
            var model = this.collection.get(content);
            var url = model.urlRoot() + '/deleteConfiguration/';
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
            var $rows;
            var data;
            var self = this;

            $checkboxes.each(function (key, item) {
                $item = $(item);
                configurationIds.push($item.attr('id'));
            });

            data = {
                ids     : configurationIds,
                retailId: model.get('_id'),
                archived: true
            };

            dataService.deleteData(url, data, function (err, response) {
                if (err) {
                    return App.render({type: 'error', message: err.responseText});
                }

                $rows = $checkboxes.closest('tr');
                $rows.remove();

                self.showHideButtons($contentHolder, {delete: false, edit: false});

                return App.render({
                    type   : 'notification',
                    message: ERROR_MESSAGES.configurationElementRemoved[currentLanguage]
                });
            });
        },

        inputClick: function (e) {
            var $currentChecked = $(e.target);
            var $contentHolder = $currentChecked.closest('.dialogCategoryItem');
            var $checkBoxes = $contentHolder.find('input[type="checkbox"]:checked:not(#checkAll)');
            var checkBoxesLength = $checkBoxes.length;
            var content = $contentHolder.attr('data-content');

            if (checkBoxesLength) {
                if (checkBoxesLength === 1) {
                    this.showHideButtons($contentHolder, {edit: true, delete: true});
                } else {
                    this.showHideButtons($contentHolder, {edit: false, delete: true});
                }
            } else {
                this.showHideButtons($contentHolder, {edit: false, delete: false});
            }

            e.stopPropagation();
        },

        saveItem: function (e) {
            var $target = $(e.target);
            var $floatButtonsContainer = $target.closest('.floatButtonsContainer');
            var rowId = $floatButtonsContainer.attr('data-id');
            var $contentHolder = $target.closest('.dialogCategoryItem');
            var $row = $contentHolder.find('#' + rowId).closest('tr');
            var $inputs = $row.find('input');
            var modelId = $contentHolder.attr('data-content');
            var model = this.collection.get(modelId);
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
            var configuration;
            var url;
            var self = this;
            var dataObject = {};
            var queryType;
            var cmInput = $inputs[1].value;
            var rowInput = $inputs[2].value;

            configuration = cmInput + ' cm ' + '* ' + rowInput + ' rows';

            if (isNaN(cmInput) ||
                isNaN(rowInput) ||
                !configuration) {
                return App.render({type: 'error', message: ERROR_MESSAGES.configurationEmpty[currentLanguage]});
            }

            url = model.urlRoot() + '/configuration';

            if (rowId === 'false') {
                dataObject = {
                    retailId     : modelId,
                    configuration: configuration
                };

                queryType = 'postData';
            } else {
                url += '/?retailId=' + modelId + '&configurationId=' + rowId + '&configuration=' + configuration;
                queryType = 'putData';
            }

            dataService[queryType](url, dataObject, function (err, response) {
                var $checkbox;
                var $label;
                var configurationId;

                $contentHolder.find('input[type="checkbox"]').removeAttr('readonly');

                if (err) {
                    return App.render({type: 'error', message: err.responseText});
                }

                if (rowId === 'false') {
                    configuration = _.findWhere(response.configurations, {
                        archived     : false,
                        configuration: configuration
                    });

                    configurationId = configuration._id;
                } else {
                    configurationId = rowId;
                }

                $checkbox = $row.find('input:checkbox');
                $label = $row.find('label');

                $checkbox.attr('id', configurationId);
                $checkbox.val(configurationId);
                $checkbox.prop('checked', false);
                $label.attr('for', configurationId);

                $row.removeClass('editting');

                $row.find('input').not($checkbox).attr('readonly', 'readonly');
                self.showHideButtons($contentHolder, {add: true});
                $floatButtonsContainer.hide();
            });
        },

        cancelItem: function (e) {
            var $target = $(e.target);
            var $floatButtonsContainer = $target.closest('.floatButtonsContainer');
            var rowId = $floatButtonsContainer.attr('data-id');
            var $contentHolder = $target.closest('.dialogCategoryItem');
            var $row = $contentHolder.find('#' + rowId).closest('tr');
            var $inputs;
            var content;
            var $checkbox;

            $contentHolder.find('input[type="checkbox"]').removeAttr('readonly');

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
            }

            this.showHideButtons($contentHolder, {add: true});
            $floatButtonsContainer.hide();
        },

        setFloatContainerPosition: function ($contentHolder, $row, id) {
            var rowPosition;
            var scrollableContainerPosition;
            var rowHeight;
            var floatPosition;
            var $scrollableContainer = $contentHolder.find('.scrollable');
            var $floatButtonsContainer = $contentHolder.find('.floatButtonsContainer');
            rowPosition = $row.position();
            rowHeight = $row.height();
            scrollableContainerPosition = $scrollableContainer.position();

            floatPosition = scrollableContainerPosition.top + rowPosition.top + rowHeight + rowHeight / 4 - $floatButtonsContainer.height() / 2;

            $floatButtonsContainer.css({top: floatPosition});
            $floatButtonsContainer.attr('data-id', id);
            $floatButtonsContainer.show();
        },

        addNewRow: function (e) {
            var $target = $(e.target);
            var $contentHolder = $target.closest('.dialogCategoryItem');
            var content = $contentHolder.attr('data-content');
            var template = this.newConfigurationTemplate;
            var $newRow = $(template({
                translation: this.translation
            }));
            var $newAddedRow;

            $contentHolder.find('.listBody').prepend($newRow);
            this.setFloatContainerPosition($contentHolder, $newRow, 'false');
            this.showHideButtons($contentHolder, {add: false, delete: false, edit: false});
            $contentHolder.find('input[type="checkbox"]').attr('readonly', 'readonly');
        },

        showConfigurations: function (e) {
            var $el = $(e.target).closest('tr');
            var modelId = $el.attr('data-id');
            var model = this.collection.get(modelId);
            var configurations;
            var self = this;
            var $dialog = this.$el;
            var $checkBox = $dialog.find('#checkAll');

            $checkBox.prop('checked', false);

            e.preventDefault();

            $dialog.find('.floatButtonsContainer').hide();
            this.showHideButtons($dialog, {add: true, delete: false, edit: false});

            model.fetch({
                success: function (model) {
                    configurations = model.getConfigurations();
                    self.$el.find('#configurationsHolder').attr('data-content', modelId);
                    self.renderTableList({name: 'configurations', data: configurations});
                }
            });
        },

        showHideButtons: function ($contentHolder, options) {
            var $btnHolder = $contentHolder.find('.categoryButtonWrap');
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

        renderTableList: function (options) {
            var $curEl = this.$el;
            var name = options.name;
            var template = (name === 'retailSegments') ? this.retailSegmentListTemplate : this.configurationListTemplate;
            var data = options.data || [];
            var $contentHolder = $curEl.find('#' + name + 'Holder');

            $contentHolder
                .removeClass('tableBlocked')
                .find('.listBody')
                .html('')
                .append(template({
                        data: data
                    })
                );

            this.showHideButtons($contentHolder, {add: true, delete: false, edit: false});
        },

        renderTable: function (options) {
            var $container = options.element || this.$el;
            var name = options.name;
            var template;

            if (name) {
                template = (name === 'retailSegments') ? this.retailSegmentTemplate : this.configurationTemplate;

                $container
                    .find('#' + name + 'Holder')
                    .html('')
                    .addClass('tableBlocked')
                    .append(template({
                            translation: this.translation
                        })
                    );
            }
        },

        render: function () {
            var $formString = $(this.template({
                translation: this.translation
            }));
            var retailSegments = this.collection;

            this.renderTable({name: 'configurations', element: $formString});
            this.renderTable({name: 'retailSegments', element: $formString});

            this.$el = $formString.dialog({
                width      : '80%',
                height     : '80%',
                dialogClass: 'create-dialog',
                title      : 'Manage Configurations'
            });

            this.renderTableList({name: 'retailSegments', data: retailSegments.toJSON()});
            this.delegateEvents(this.events);

            return this;
        }
    });

    return manageView;
});
