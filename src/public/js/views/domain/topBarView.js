define(['backbone',
        'jQuery',
        'Underscore',
        'text!templates/domain/topBarTemplate.html',
        'text!templates/pagination/pagination.html',
        'views/baseTopBar',
        'helpers/contentTypesHelper',
        'constants/contentType'
    ],
    function (Backbone, $, _, topBarTemplate, pagination, baseTopBar, contentTypes, CONTENT_TYPES) {
        var types = [
            CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH
        ];

        var TopBarView = baseTopBar.extend({
            template          : _.template(topBarTemplate),
            paginationTemplate: _.template(pagination),

            changeContentType: function (newContentType, collection, translation) {
                var level = App.currentUser.accessRole.level;

                this.contentType = newContentType;
                this.creationType = contentTypes.getCreationType(contentTypes.getNextType(this.contentType));

                if ((level <= 2) || (level >= 8)) {
                    if (this.creationType === 'country' || this.creationType === 'Country') {
                        if (level !== 2 && level !== 9) {
                            this.$createBtn.show();
                        } else {
                            this.$createBtn.hide();
                        }
                    } else {
                        this.$createBtn.show();
                    }
                } else {
                    this.$createBtn.hide();
                }

                this.changeTranslatedFields(translation);

                this.setPagination({
                    length     : collection.totalRecords,
                    currentPage: collection.currentPage,
                    itemsNumber: collection.pageSize
                });
            },

            setStatus: function () {
                var valuesArray;
                var collectionElement;

                valuesArray = this.filter.translated.values;

                if (valuesArray) {
                    for (var i = valuesArray.length - 1;
                         i >= 0;
                         i--) {
                        collectionElement = this.translatedCollection.findWhere({_id: valuesArray[i]});
                        collectionElement.set({status: true});
                    }
                }
            },

            changeTabs: function (value) {
                var level = App.currentUser.accessRole.level;
                var $curEl = this.$el;
                var $container = $curEl.find('#templateSwitcher');
                var $actionBar = $curEl.find('#actionHolder');
                var filterTab = value === 'archived';
                var $targetAction = $actionBar.find('[data-archived-type="' + filterTab + '"]');
                var $targetTab = $container.find('#' + value);
                var $createBtn = $curEl.find('#createBtn');
                var $editBtn = $curEl.find('#editBtn');

                var $checkboxes = $curEl.find('input[type="checkbox"]');

                this.tabName = value;

                $checkboxes.prop('checked', false);

                $targetTab.addClass('viewBarTabActive');
                $targetTab.siblings().removeClass('viewBarTabActive');

                $targetAction.show('viewBarTabActive');
                $targetAction.siblings('.archiveBtn').hide('viewBarTabActive');

                if (filterTab === false) {
                    if ((level <= 2) || (level >= 8)) {
                        if (this.creationType === 'country' || this.creationType === 'Country') {
                            if (level !== 2 && level !== 9) {
                                this.$createBtn.show();
                            } else {
                                this.$createBtn.hide();
                            }
                        } else {
                            this.$createBtn.show();
                        }
                    } else {
                        this.$createBtn.hide();
                    }
                } else {
                    $createBtn.hide();
                    $editBtn.hide();
                }

                this.hideAction();

                this.trigger('showFilteredContent', value);
            },

            render: function () {
                var level = App.currentUser.accessRole.level;
                var paginationContainer;
                var $archiveBtn;
                var $unArchiveBtn;
                var $createBtn;
                var $thisEl = this.$el;

                contentTypes.setContentTypes(types);

                $('title').text(this.contentType);

                this.creationType = contentTypes.getCreationType(this.contentType);

                $thisEl.html(this.template({
                    viewType    : this.viewType,
                    contentType : contentTypes.getDisplayName(this.contentType),
                    creationType: contentTypes.getDisplayName(this.creationType),
                    translation : this.translation
                }));

                this.$createBtn = this.$createBtn || $thisEl.find('#createBtn');
                this.$mainContent = this.$mainContent || $thisEl.find('#all');
                this.$actionButton = $thisEl.find('.actionBtn');
                this.$editButton = $thisEl.find('#editBtn');

                $thisEl.find('#' + this.tabName).addClass('viewBarTabActive');

                paginationContainer = $thisEl.find('#paginationHolder');
                paginationContainer.html(this.paginationTemplate({translation: this.translation}));

                $archiveBtn = $thisEl.find('#archiveBtn');
                $unArchiveBtn = $thisEl.find('#unArchiveBtn');
                $createBtn = $thisEl.find('#createBtn');

                if (this.tabName === 'archived') {
                    $archiveBtn.hide();
                    $unArchiveBtn.show();
                    $createBtn.hide();
                } else {
                    $createBtn.show();
                    $archiveBtn.show();
                    $unArchiveBtn.hide();
                }

                if ((level <= 2) || (level >= 8)) {
                    if (this.creationType === 'country' || this.creationType === 'Country') {
                        if (level !== 2 && level !== 9) {
                            this.$createBtn.show();
                        } else {
                            this.$createBtn.hide();
                        }
                    } else {
                        this.$createBtn.show();
                    }
                } else {
                    this.$createBtn.hide();
                }

                return this;
            }
        });

        return TopBarView;
    });
