define([
    'Backbone',
    'Underscore',
    'jQuery',
    'helpers/contentTypesHelper',
    'views/domain/thumbnailsForSelection',
    'js-cookie',
    'constants/contentType',
    'constants/personnelLocationFlow',
    'moment',
    'constants/personnelStatuses',
    'dataService',
    'custom',
    'constants/errorMessages'
], function (Backbone, _, $, contentTypes, DomainThumbnailsView, Cookies, CONTENT_TYPES, PERSONNEL_LOCATION_FLOW,
             moment, STATUSES, dataService, custom, ERROR_MESSAGES) {
    'use strict';
    var types = [
        CONTENT_TYPES.COUNTRY,
        CONTENT_TYPES.REGION,
        CONTENT_TYPES.SUBREGION,
        CONTENT_TYPES.BRANCH
    ];

    var createPersonnelViewLogic = function (context) {
        var logic = {
            view: context,

            cacheDomainFields: function (element) {
                var $currEl = element || this.view.$el;

                this.$country = $currEl.find('#countryDiag');
                this.$region = $currEl.find('#regionDiag');
                this.$subRegion = $currEl.find('#subRegionDiag');
                this.$retailSegment = $currEl.find('#retailSegmentDiag');
                this.$outlet = $currEl.find('#outletDiag');
                this.$branch = $currEl.find('#branchDiag');
            },

            setDomainDataToHtmlFromModel: function (personnelModel) {
                var self = this;
                var model = personnelModel.toJSON();
                var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
                var anotherLanguage = (currentLanguage === 'en') ? 'ar' : 'en';
                var firstMiss = true;
                var dataEl;

                contentTypes.forEachType(function (type) {
                    var domains = model[type];
                    var ids = [];
                    var names;
                    var currentName;
                    var length;
                    var i;

                    dataEl = self['$' + type];

                    if (domains && domains.length) {

                        length = domains.length;
                        names = domains[length - 1].name[currentLanguage] || domains[length - 1].name[anotherLanguage];
                        ids.push(domains[length - 1]._id);

                        if (length > 1) {
                            firstMiss = false;
                        }

                        for (i = length - 2;
                             i >= 0;
                             i--) {
                            currentName = domains[i].name[currentLanguage] || domains[i].name[anotherLanguage];
                            names = currentName + ', ' + names;
                            ids.push(domains[i]._id);
                        }

                        if (ids.length) {
                            dataEl.text(names);
                            dataEl.addClass('pencil');
                            dataEl.attr('data-id', ids);
                            dataEl.attr('data-initial-value', ids);
                        }

                    } else {
                        if (firstMiss) {
                            firstMiss = false;
                            dataEl.attr('data-id', '');
                            dataEl.attr('data-initial-value', '');
                        } else {
                            self.clearAndHideDomainFields(type);
                        }

                    }
                });
            },

            getDataFromHtmlAndSaveModel: function (personnelModel, img, translation, cb) {
                var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
                var obj;
                var value;
                var self = this;
                var parentProperties = [];
                var updateData = {};
                var propertyName;
                var keys;
                var model;
                var condition;

                var getValueFromInput = function (element) {
                    var value;

                    if (element.hasClass('dropDown')) {
                        value = element.attr('data-id');
                    } else if (element.attr('data-masked') === 'true') {
                        value = $.trim(element.inputmask('unmaskedvalue'));
                    } else if (element.attr('type') === 'checkbox') {
                        value = element.prop('checked');
                    } else {
                        value = $.trim(element.val());
                    }

                    return {value: value, raw: value};
                };

                var getValueByDataFormat = function (element) {
                    var dataFormat = element.attr('data-format');
                    var contentType = element.attr('data-value');
                    var rawValue = element.attr('data-id');
                    var value;

                    if (PERSONNEL_LOCATION_FLOW[self.personnelAccessRoleLevel] && PERSONNEL_LOCATION_FLOW[self.personnelAccessRoleLevel].indexOf(contentType) === -1 && contentType !== 'cover') {
                        return {value: [], raw: rawValue};
                    }

                    if (dataFormat === 'array') {
                        value = rawValue ? rawValue.split(',') : [];
                    } else {
                        value = rawValue;
                    }

                    return {value: value, raw: rawValue};
                };

                $('.formField').each(function () {
                    var el = $(this);
                    var tagName = el.prop('tagName');
                    var initialValue = el.attr('data-value');
                    var propertyName = el.attr('data-property');
                    var parentProperty = el.attr('data-parent');
                    var current = tagName === 'INPUT' ? getValueFromInput(el) : getValueByDataFormat(el);

                    if (parentProperty) {
                        current.initial = initialValue;
                        updateData[parentProperty] = updateData[parentProperty] || {};
                        updateData[parentProperty][propertyName] = current;

                        if (!~parentProperties.indexOf(parentProperty)) {
                            parentProperties.push(parentProperty);
                        }
                    } else if (current.raw !== initialValue) {
                        updateData[propertyName] = current.value;
                    }
                });

                for (var i = parentProperties.length - 1; i >= 0; i--) {
                    propertyName = parentProperties[i];
                    obj = updateData[propertyName];
                    keys = Object.keys(obj);

                    if (keys.every(function (key) {
                            return obj[key].initial === obj[key].raw;
                        })) {
                        delete updateData[propertyName];
                    }
                    else {
                        keys.forEach(function (key) {
                            obj[key] = obj[key].value;
                        });
                    }
                }

                //todo check if image changed
                updateData.imageSrc = img;

                updateData.confirmed = personnelModel.get('confirmed');
                updateData.lastAccess = personnelModel.get('lastAccess');
                updateData.temp = personnelModel.get('temp');

                updateData.dateJoined = moment(updateData.dateJoined, 'DD.MM.YYYY').toISOString();

                if (cb && typeof(cb) === 'function') {
                    model = personnelModel.toJSON();
                    Object.keys(model).forEach(function (key) {
                        condition = false;
                        if (Array.isArray(model[key])) {
                            var ids = _.pluck(model[key], '_id');
                            if (ids.length) {
                                if (updateData[key] && updateData[key].length && updateData[key].length !== ids.length) {
                                    return;
                                }
                                var newIdsToSave = _.difference(ids, updateData[key]);
                                if (!newIdsToSave.length) {
                                    condition = true;
                                }
                            }
                        }
                        else if (['firstName', 'lastName'].indexOf(key) !== -1) {
                            if (updateData[key].en === model[key].en && updateData[key].ar === model[key].ar) {
                                condition = true;
                            }
                        } else if (key === 'dateJoined') {
                            var date = custom.dateFormater('DD.MM.YYYY', updateData[key]);
                            if (date === model[key]) {
                                condition = true;
                            }
                        } else if (['accessRole', 'position', 'vacation'].indexOf(key) !== -1) {
                            if (key === 'vacation') {
                                var vacationChange = false;
                                if (updateData[key].cover) {
                                    if (updateData[key].cover !== model[key].cover) {
                                        vacationChange = true;
                                    }
                                }
                                if (updateData[key].onLeave !== model[key].onLeave) {
                                    vacationChange = true;
                                }
                                if (!vacationChange) {
                                    condition = true;
                                }
                            }
                            if (updateData[key] === model[key]._id) {
                                condition = true;
                            }
                        } else {
                            if (updateData[key] === model[key]) {
                                condition = true;
                            }
                        }

                        if (condition) {
                            delete updateData[key];
                        }
                    });
                }

                delete updateData.period;

                if (!Object.keys(updateData).length) {
                    return cb();
                }

                personnelModel.setFieldsNames(translation);

                updateData.accessRoleLevel = this.personnelAccessRoleLevel || -1;

                personnelModel.save(updateData,
                    {
                        patch  : true,
                        wait   : true,
                        success: function (model, response) {
                            var message;
                            var status = model.get('status');

                            if (status === 'login') {
                                message = STATUSES[status.toUpperCase()].name[currentLanguage] + ' ' + model.get('lastAccess');
                            } else {
                                message = STATUSES[status.toUpperCase()].name[currentLanguage];
                            }

                            model.set({
                                status: {
                                    classCss: status,
                                    message : message
                                }
                            });

                            self.view.trigger('modelSaved', model);

                            if (!cb) {
                                return self.view.$el.dialog('close').dialog('destroy').remove();
                            } else {
                                return cb();
                            }
                        },
                        error  : function (model, xhr) {
                            App.render({type: 'error', message: xhr.responseText});

                            if (cb && typeof(cb) === 'function') {
                                return cb();
                            }
                        }
                    });
            },

            showDomainDialog: function (domainType) {
                var self = this;
                var view = self.view;
                var $currentDomainA = this['$' + domainType];
                var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
                var translationsUrl = 'translations/' + currentLanguage + '/' + domainType;
                var url = 'collections/' + domainType + '/collection';
                var dataId = $currentDomainA.attr('data-id');
                var currentDomains = dataId !== '' ? dataId.split(',') : [];
                var collection;
                var $prevDomainA;
                var parentId;
                var locationFlow = PERSONNEL_LOCATION_FLOW[this.personnelAccessRoleLevel];
                var multiSelect = domainType === locationFlow[locationFlow.length - 1];

                if (domainType !== 'country') {
                    $prevDomainA = this['$' + contentTypes.getPreviousType(domainType)];
                    parentId = $prevDomainA.attr('data-id');
                }

                require([url, translationsUrl], function (Collection, translation) {
                    var subRegionsId;
                    var creationOptions = {
                        viewType     : 'thumbnails',
                        newCollection: true,
                        count        : -1
                    };

                    if (parentId && domainType !== 'branch') {
                        creationOptions.filter = {
                            parent: {
                                values: parentId.split(','),
                                type  : 'ObjectId'
                            }
                        };
                    } else if (parentId) {
                        subRegionsId = self.$subRegion.attr('data-id').split(',');
                        creationOptions.filter = {
                            subRegion: {
                                values: subRegionsId,
                                type  : 'ObjectId'
                            }
                        };
                    }

                    if (self.personnelAccessRoleLevel === 2 ||
                        self.personnelAccessRoleLevel === 3 ||
                        self.personnelAccessRoleLevel === 4 ||
                        self.personnelAccessRoleLevel === 9) {
                        creationOptions.accessRoleLevel = self.personnelAccessRoleLevel;
                    }

                    view.collection = new Collection(creationOptions);

                    view.collection.on('reset', function () {
                        var selectView;

                        if (view.collection.length === 0) {
                            return App.render({
                                type   : 'error',
                                message: translation.domainName + ERROR_MESSAGES.noData[currentLanguage]
                            });
                        }

                        selectView = new DomainThumbnailsView({
                            selected   : currentDomains,
                            contentType: domainType,
                            collection : view.collection,
                            multiselect: multiSelect
                        });
                        selectView.on('elementsSelected', function (data) {
                            self.onDomainSelected(data, domainType, self);
                        });
                    });
                });
            },

            onDomainSelected: function (data, domainType) {
                var $currentDomainA = this['$' + domainType];
                var self = this;
                var showNextField;
                var text = '';
                var ids = [];
                var nextDomainType = contentTypes.getNextType(domainType);
                var allAfterDomainType = contentTypes.getAllAfter(domainType);

                allAfterDomainType.forEach(function (type) {
                    self['$' + type].hide();
                    self['$' + type].attr('data-id', '');
                    self['$' + type].text('');
                });

                if (nextDomainType) {
                    this['$' + nextDomainType].show();
                }

                if (!this.lastSelectedDomainType && allAfterDomainType && allAfterDomainType.length) {
                    this.lastSelectedDomainType = allAfterDomainType[allAfterDomainType.length - 1];
                }

                if (contentTypes.moreThan(this.lastSelectedDomainType, domainType)) {
                    this.clearAndHideDomainFieldsAfter(domainType);
                }

                this.lastSelectedDomainType = domainType;

                data.forEach(function (id) {
                    var model = context.collection.get(id);
                    text = text + model.get('name').en + ', ';
                    ids.push(id);
                });

                text = text ? text.slice(0, -2) : text;

                $currentDomainA.attr('data-icon', ids ? 'edit' : 'add');
                $currentDomainA.text(text);
                $currentDomainA.attr('data-id', ids);

                showNextField = this.userHasAccessTo(nextDomainType) && data.length === 1;

                this.view.$el.find('.' + nextDomainType + 'Field').toggle(showNextField);
            },

            showDomainsRows: function (level) {
                var self = this;
                var setFirstActive = true;

                this.personnelAccessRoleLevel = level;

                types.forEach(function (contentType) {
                    var dataEl;
                    var value;

                    if (PERSONNEL_LOCATION_FLOW[level].indexOf(contentType) === -1) {
                        self.view.$el.find('#' + contentType + 'Row').addClass('hidden');
                        self.clearAndHideDomainFields(contentType);
                    } else {
                        self.view.$el.find('#' + contentType + 'Row').removeClass('hidden');

                        if (setFirstActive) {
                            dataEl = self['$' + contentType];
                            value = dataEl.attr('data-id');

                            if (!value) {
                                dataEl.show();
                                setFirstActive = false;
                            }
                        }
                    }
                });
            },

            clearAndHideDomainFieldsAfter: function (startDomainType) {
                var types = _.intersection(contentTypes.getAllAfter(startDomainType), PERSONNEL_LOCATION_FLOW[this.personnelAccessRoleLevel]);

                for (var i = types.length - 1;
                     i >= 0;
                     i--) {
                    this.clearAndHideDomainFields(types[i]);
                }
            },

            clearAndHideDomainFields: function (type) {
                var $a = this['$' + type];

                $a.attr('data-id', '');
                $a.attr('data-icon', 'add');
                $a.text('');
                $a.hide();
            },

            userHasAccessTo: function (domainType) {
                return !!domainType;
            },

            allowsMultiselection: function (domainType) {
                return true;
            },

            resetContentTypes: contentTypes.resetContentTypes
        };

        contentTypes.setContentTypes(types);

        return logic;
    };
    return createPersonnelViewLogic;
});
