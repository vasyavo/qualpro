'use strict';
define([
    'jQuery',
    'Underscore',
    'text!templates/personnel/preview/evaluation.html',
    'views/baseDialog',
    'views/personnel/forms/monthlyEvaluationFormView',
    'views/personnel/forms/biYearlyEvaluationFormView',
    'collections/rating/collection',
    'text!templates/personnel/preview/ratingList.html',
    'views/filter/dropDownView',
    'collections/filter/filterCollection',
    'views/personnel/forms/biYearlyEvaluationPreview',
    'views/personnel/forms/monthlyEvaluationPreview',
    'moment',
    'constants/errorMessages'
], function ($, _, template, BaseView, MonthlyEvaluationFormView, BiYearlyEvaluationFormView, RatingCollection, ratingListTemplate,
             DropDownView, FilterCollection, BiYearlyPreview, MonthlyPreview, moment, ERROR_MESSAGES) {

    var EvaluationView = BaseView.extend({

        template          : _.template(template),
        ratingListTemplate: _.template(ratingListTemplate),

        initialize: function (options) {
            var self = this;

            this.personnel = options.personnel;
            this.contentType = options.contentType;
            this.constants = options.constants;
            this.translation = options.translation;

            this.firstInListDd = this.constants.listDd[0];
            this.recentsNum = +this.firstInListDd._id + 1;

            this.ratingCollection = new RatingCollection({
                contentType: this.contentType,
                personnel  : this.personnel._id,
                recentsNum : this.recentsNum
            });
            this.ratingCollection.bind('reset', _.bind(this.renderRatings, self));

            this.responseObj = {};

            this.makeRender();
            this.render();
        },

        events: {
            'click .currentSelected': 'showNewSelect',
            'click .rateEmployee'   : 'rateEmployeeClicked',
            'click .viewDetails'    : 'onViewDetails',
            'click .rateNow'        : 'onRateNow'
        },

        rateEmployeeClicked: function (e) {
            var currentDate = new Date();
            var currentMonth = currentDate.getMonth() + 1;
            var accessLevel = App.currentUser.accessRole.level;
            var personnelAccessLevel = this.personnel.accessRole.level;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

            if (accessLevel < 1 || accessLevel > 3 || accessLevel >= personnelAccessLevel) {
                return App.render({type: 'alert', message: ERROR_MESSAGES.noRightsToRate[currentLanguage]});
            }

            switch (this.contentType) {
                case 'monthly':

                    if (currentDate.getDate() > 10 && accessLevel !== 1 && accessLevel !== 2) {
                        return App.render({type: 'alert', message: ERROR_MESSAGES.noRightsToRate[currentLanguage]});
                    }

                    currentDate.setMonth(currentDate.getMonth() - 1);

                    this.monthlyEvaluationForm = new MonthlyEvaluationFormView({
                        translation: this.translation,
                        personnel  : this.personnel,
                        month      : currentDate.getMonth() + 1,
                        year       : currentDate.getFullYear()
                    });

                    this.monthlyEvaluationForm.on('monthlyEvaluationSave', this.onMonthlyEvaluationSave, this);

                    break;

                case 'biYearly':

                    if (currentMonth !== 7 && currentMonth !== 1 && accessLevel !== 1 && accessLevel !== 2) {
                        return App.render({
                            type   : 'alert',
                            message: ERROR_MESSAGES.permissionToRateJulyJanuary[currentLanguage]
                        });
                    }

                    this.biYearlyEvaluationForm = new BiYearlyEvaluationFormView({
                        translation: this.translation
                    });
                    this.biYearlyEvaluationForm.on('formSubmit', this.onFormSubmitted, this);

                    break;

                default:
                    App.render({
                        type   : 'alert',
                        message: ERROR_MESSAGES.wrongEvaluationContentType[currentLanguage]
                    });
            }
        },

        onViewDetails: function (e) {
            var $target = $(e.target);
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
            var ratingId;
            var model;

            if ($target.closest('td').attr('class') === 'viewDetails') {
                ratingId = $target.closest('tr').attr('id');
            } else {
                ratingId = $target.siblings('div').attr('id');
            }

            model = this.ratingCollection.get(ratingId);

            switch (this.contentType) {
                case 'monthly':
                    this.monthlyPreview = new MonthlyPreview({
                        model      : model,
                        translation: this.translation,
                        personnel  : this.personnel
                    });

                    this.monthlyPreview.on('monthlyEvaluationSave', this.onMonthlyEvaluationSave, this);

                    break;

                case 'biYearly':
                    this.biYearlyPreview = new BiYearlyPreview({
                        collection   : this.ratingCollection,
                        originalModel: model,
                        translation  : this.translation,
                        personnel    : this.personnel
                    });

                    this.biYearlyPreview.on('formSubmit', this.onFormSubmitted, this);

                    break;

                default:
                    App.render({
                        type   : 'alert',
                        message: ERROR_MESSAGES.wrongEvaluationContentType[currentLanguage]
                    });
            }
        },

        onRateNow: function (e) {
            var accessLevel = App.currentUser.accessRole.level;
            var personnelAccessLevel = this.personnel.accessRole.level;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
            var $target;
            var year;
            var month;

            if (accessLevel !== 1 && accessLevel !== 2 || accessLevel >= personnelAccessLevel) {
                return App.render({
                    type   : 'alert',
                    message: ERROR_MESSAGES.noRightsToRatePastPeriod[currentLanguage]
                });
            }

            $target = $(e.target);
            this.notRatedDataKey = $target.closest('tr').attr('id');

            switch (this.contentType) {
                case 'monthly':
                    year = parseInt(this.notRatedDataKey.substr(0, 4), 10);
                    month = parseInt(this.notRatedDataKey.substr(4, 2), 10);

                    this.monthlyEvaluationForm = new MonthlyEvaluationFormView({
                        translation: this.translation,
                        personnel  : this.personnel,
                        month      : month,
                        year       : year
                    });

                    this.monthlyEvaluationForm.on('monthlyEvaluationSave', this.onMonthlyEvaluationSave, this);

                    break;

                case 'biYearly':
                    this.biYearlyEvaluationForm = new BiYearlyEvaluationFormView({
                        translation: this.translation
                    });
                    this.biYearlyEvaluationForm.on('formSubmit', this.onFormSubmitted, this);

                    break;

                default:
                    App.render({
                        type   : 'alert',
                        message: ERROR_MESSAGES.wrongEvaluationContentType[currentLanguage]
                    });
            }
        },

        onMonthlyEvaluationSave: function (model) {
            var $thisEl = this.$el;
            var periodId = $thisEl.find('#periodDd').attr('data-id');
            var $averageRating = $thisEl.find('.averageRating').show().find('.rating');
            var avgRating = Math.round(model.get('avgRating'));

            $averageRating
                .barrating('show')
                .barrating('readonly', false)
                .barrating('set', avgRating)
                .barrating('readonly', true);

            this.selectRatingList(periodId);
        },

        onFormSubmitted: function (e) {
            var form = e.target;
            var ratingModel = form.model;
            var self = this;

            if (this.notRatedDataKey) {
                ratingModel.set('dataKey', this.notRatedDataKey);
            }

            ratingModel.set('personnel', ratingModel.personnel || this.personnel._id);
            ratingModel.save(ratingModel.attributes, {
                success: function (model, xhr) {
                    if (self.biYearlyEvaluationForm) {
                        self.biYearlyEvaluationForm.trigger('biYearlyEvaluationSaved');
                    }

                    if (self.biYearlyPreview) {
                        self.biYearlyPreview.trigger('biYearlyEvaluationSaved');
                    }

                    if (self.notRatedDataKey) {
                        self.notRatedDataKey = null;
                    }

                    self.$el.find('.averageRating .rating').attr('data-rate-value', model.get('avgRating'));

                    self.ratingCollection.fetch({
                        data : {
                            contentType: self.contentType,
                            personnel  : self.personnel._id,
                            recentsNum : self.recentsNum
                        },
                        reset: true
                    });
                },
                error  : function (model, xhr) {
                    var error = xhr.responseText || '';

                    App.render({type: 'error', message: error});
                }
            });
        },

        selectRatingList: function (id) {
            this.recentsNum = +id + 1;

            this.ratingCollection.fetch({
                data : {
                    contentType: this.contentType,
                    personnel  : this.personnel._id,
                    recentsNum : this.recentsNum
                },
                reset: true
            });
        },

        renderRatings: function () {
            var self = this;
            var $thisEl = this.$el;
            var $currentRating = $thisEl.find('.currentRating');

            var ratingCollection = this.ratingCollection.toJSON();
            var lastRating = (ratingCollection && ratingCollection[0]) ? ratingCollection[0] : {};

            var date = new Date();
            var nextMonth;
            var nextYear;
            var currentMonth;
            var currentYear;
            var currentDataKey;
            var lastRatingBiYerlyMaxDataKey;
            var nextRatingPeriod;

            var accessLevel = App.currentUser.accessRole.level;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
            var personnelAccessLevel = this.personnel.accessRole.level;
            var noRateNow = accessLevel !== 1 && accessLevel !== 2 || accessLevel >= personnelAccessLevel;

            function showCurrentRating() {
                var $rating = $currentRating.find('.rated').show().find('.rating');

                //ratingCollection.shift();
                if (self.contentType === 'biYearly') {
                    $rating.attr('data-rate-value', lastRating.rating).attr('id', lastRating._id);
                } else {
                    $rating
                        .barrating('show')
                        .barrating('readonly', false)
                        .barrating('set', lastRating.rating)
                        .barrating('readonly', true);
                    $rating.parent().attr('id', lastRating._id);
                }

                $currentRating.find('.needRate').hide();
                $currentRating.find('.notRated').hide();
            }

            nextMonth = date.getMonth() + 1;
            nextYear = date.getFullYear();
            // date sets to previous month and all of this are previous, not current (but such logic)
            date.setMonth(date.getMonth() - 1);
            currentMonth = date.getMonth() + 1;
            currentYear = date.getFullYear();
            currentDataKey = currentYear * 100 + currentMonth;

            switch (this.contentType) {
                case 'monthly':
                    nextRatingPeriod = nextYear * 100 + nextMonth;

                    if (currentDataKey === +lastRating.dataKey) {
                        showCurrentRating();
                    }

                    ratingCollection = this.addNotRatedRatingsToCollection(this.contentType, ratingCollection, nextRatingPeriod);


                    break;

                case 'biYearly':
                    lastRatingBiYerlyMaxDataKey = (lastRating.month === 6) ?
                    lastRating.year * 100 + 12 : (lastRating.year + 1) * 100 + 6;

                    if (currentDataKey >= +lastRating.dataKey && currentDataKey < lastRatingBiYerlyMaxDataKey) {
                        showCurrentRating();
                    }

                    ratingCollection = this.addNotRatedRatingsToCollection(this.contentType, ratingCollection, lastRatingBiYerlyMaxDataKey);

                    break;

                default:
                    App.render({
                        type   : 'alert',
                        message: ERROR_MESSAGES.wrongEvaluationContentType[currentLanguage]
                    });
            }

            if (ratingCollection.length === this.recentsNum) {
                ratingCollection.pop();
            }

            $thisEl.find('.listTable').html(this.ratingListTemplate({
                ratings    : ratingCollection,
                noRateNow  : noRateNow,
                translation: this.translation

            }));

            if (this.contentType === 'monthly') {
                $thisEl.find('.rating').barrating({readonly: true});
            } else {
                $thisEl.find('.rating').rateName(this.constants);
            }

            return this;
        },

        getPreviousDataKey: function (contentType, dataKey) {
            var year = parseInt(dataKey.substr(0, 4));
            var month = parseInt(dataKey.substr(4, 2));
            var newDataKey;

            if (contentType === 'biYearly') {
                if (month === 6) {
                    newDataKey = ((year - 1) * 100 + 12).toString();

                    return {
                        _id          : newDataKey,
                        dataKey      : newDataKey,
                        timeFirstCaps: 'Fall',
                        year         : year - 1,
                        type         : 'biYearly'
                    };
                } else {
                    newDataKey = (year * 100 + 6).toString();

                    return {
                        _id          : newDataKey,
                        dataKey      : newDataKey,
                        timeFirstCaps: 'Spring',
                        year         : year,
                        type         : 'biYearly'
                    };
                }
            } else {
                if ((month - 1) === 0) {
                    year--;
                    month = 12;
                } else {
                    month--;
                }

                newDataKey = (year * 100 + month).toString();

                return {
                    _id      : newDataKey,
                    dataKey  : newDataKey,
                    monthLong: moment().set('month', month - 1).format('MMMM'),
                    year     : year,
                    type     : 'monthly'
                };
            }
        },

        addNotRatedRatingsToCollection: function (contentType, ratingCollectionJSON, lastRatingBiYerlyMaxDataKey) {
            var prevDataKey;
            var currentDate;
            var currentYear;
            var currentMonth;
            var newLength = this.recentsNum;
            var confirmedDate = this.personnel.confirmed ? new Date(this.personnel.confirmed) : new Date();
            var confirmedYear = confirmedDate.getFullYear();
            var confirmedMonth = confirmedDate.getMonth() + 1;
            var confirmedDataKey = confirmedYear * 100 + confirmedMonth;

            if (Number.isNaN(lastRatingBiYerlyMaxDataKey)) {
                currentDate = new Date();
                currentYear = currentDate.getFullYear();
                currentMonth = currentDate.getMonth() + 1;
                currentMonth = currentMonth <= 6 ? 6 : 12;
                lastRatingBiYerlyMaxDataKey = currentYear * 100 + currentMonth;
            }

            for (var i = 0, len = this.recentsNum; i < len; i++) {
                if (i === 0) {
                    prevDataKey = this.getPreviousDataKey(contentType, lastRatingBiYerlyMaxDataKey.toString());

                    if (ratingCollectionJSON[i]) {
                        if (ratingCollectionJSON[i].dataKey !== prevDataKey.dataKey) {
                            ratingCollectionJSON = [prevDataKey].concat(ratingCollectionJSON);
                        }
                    } else {
                        ratingCollectionJSON[i] = prevDataKey;
                    }

                } else {
                    prevDataKey = this.getPreviousDataKey(contentType, ratingCollectionJSON[i - 1].dataKey);

                    if (ratingCollectionJSON[i]) {
                        if (ratingCollectionJSON[i].dataKey !== prevDataKey.dataKey) {
                            ratingCollectionJSON.splice(i, 0, prevDataKey);
                        }
                    } else {
                        ratingCollectionJSON[i] = prevDataKey;
                    }
                }

                if (prevDataKey.dataKey < confirmedDataKey) {
                    newLength = i;
                    break;
                }

            }

            ratingCollectionJSON.length = newLength;
            ratingCollectionJSON.shift();

            return ratingCollectionJSON;
        },

        render: function () {
            var $thisEl;
            var $currentRating;

            var date = new Date();
            var nextMonthDate = new Date();
            var daysLeft;
            var currentMonth;
            var self = this;

            var accessLevel = App.currentUser.accessRole.level;
            var personnelAccessLevel = this.personnel.accessRole.level;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

            function showNotRated() {
                $currentRating.find('.rated').hide();
                $currentRating.find('.needRate').hide();
                $currentRating.find('.notRated').show();
            }

            if (this.contentType === 'monthly') {
                daysLeft = 10 - date.getDate();
            } else {
                nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                nextMonthDate.setDate(0);
                daysLeft = nextMonthDate.getDate() - date.getDate();
            }

            date.setMonth(date.getMonth() - 1);
            currentMonth = date.getMonth() + 1;

            this.$el.html(this.template({
                personnel  : this.personnel,
                contentType: this.contentType,
                daysLeft   : daysLeft,
                translation: this.translation
            }));

            $thisEl = this.$el;
            $currentRating = $thisEl.find('.currentRating');
            $currentRating.find('.needRate').show();
            $currentRating.find('.rated').hide();
            $currentRating.find('.notRated').hide();

            if (!(this.personnel.avgRating && this.personnel.avgRating[this.contentType])) {
                $currentRating.find('.averageRating').hide();
            }

            switch (this.contentType) {
                case 'monthly':
                    if (daysLeft < 1 || accessLevel > 3 || accessLevel < 1 || accessLevel >= personnelAccessLevel) {
                        showNotRated();
                    }

                    break;

                case 'biYearly':
                    if ((currentMonth !== 6 && currentMonth !== 12) || accessLevel > 3 || accessLevel < 1 || accessLevel >= personnelAccessLevel) {
                        showNotRated();
                    }

                    break;

                default:
                    App.render({
                        type   : 'alert',
                        message: ERROR_MESSAGES.wrongEvaluationContentType[currentLanguage]
                    });
            }


            this.constants.listDd = new FilterCollection(this.constants.listDd, {parse: true});

            this.dropDown = new DropDownView({
                dropDownList  : this.constants.listDd,
                selectedValues: [this.constants.listDd.at(0).toJSON()],
                contentType   : 'period',
                filter        : this.filter
            })
            ;

            this.dropDown.collection.trigger('reset');

            $thisEl.find('#previousRatingDd').html(this.dropDown.el);

            this.dropDown.on('changeItem', function (e) {
                var id = e.model._id;

                self.selectRatingList(id);
            });

            return this;
        }
    });

    return EvaluationView;
});
