define([
    'Backbone',
    'jQuery',
    'async',
    'dataService',
    'moment',
    'constants/contentType',
    'constants/errorMessages'
], function (Backbone, $, async, dataService, moment, CONSTANTS, ERROR_MESSAGES) {

    var runApplication = function (success) {
        var url;

        if (!Backbone.History.started) {
            Backbone.history.start({silent: true});
        }

        if (success) {
            url = /*(App.requestedURL !== null) ? App.requestedURL || '' :*/ Backbone.history.fragment;

            if ((url === '') || (url === 'login')) {
                url = 'qualPro';
            }

            Backbone.history.fragment = "";
            Backbone.history.navigate(url, {trigger: true});

        } else {
            if (App.requestedURL === null) {
                App.requestedURL = Backbone.history.fragment === 'login/confirmed' ? null : Backbone.history.fragment;
            }

            Backbone.history.fragment = '';
            Backbone.history.navigate('login', {trigger: true});
        }
    };

    var getCurrentTab = function (contentType) {
        var tabName;

        switch (contentType) {
            case CONSTANTS.NOTIFICATIONS:
            case CONSTANTS.PERSONNEL:
            case CONSTANTS.OBJECTIVES:
            case CONSTANTS.INSTORETASKS:
            case CONSTANTS.ITEMSPRICES:
            case CONSTANTS.COMPETITORSLIST:
            case CONSTANTS.COUNTRY:
            case CONSTANTS.OUTLET:
            case CONSTANTS.RETAILSEGMENT:
            case CONSTANTS.PLANOGRAM:
            case CONSTANTS.NOTES:
                tabName = 'all';
                break;
            default:
                tabName = 'all';
                break;
        };

        return tabName;
    };

    var getCurrentVT = function (option) {
        var viewType;
        var viewVariants = ['list', 'thumbnails'];

        if (option && (option.contentType !== App.contentType)) {
            App.ownContentType = false;
        }

        if (option) {
            switch (option.contentType) {
                case CONSTANTS.NOTIFICATIONS:
                case CONSTANTS.PERSONNEL:
                case CONSTANTS.OBJECTIVES:
                case CONSTANTS.INSTORETASKS:
                case CONSTANTS.ITEMSPRICES:
                case CONSTANTS.COMPETITORSLIST:
                case CONSTANTS.PROMOTIONS:
                case CONSTANTS.NOTES:
                    App.currentViewType = 'list';
                    break;
                case CONSTANTS.COUNTRY:
                case CONSTANTS.REGION:
                case CONSTANTS.SUBREGION:
                case CONSTANTS.BRANCH:
                case CONSTANTS.OUTLET:
                case CONSTANTS.RETAILSEGMENT:
                case CONSTANTS.PLANOGRAM:
                case CONSTANTS.DOCUMENTS:
                    App.currentViewType = 'thumbnails';
                    break;
                default:
                    App.currentViewType = '';
                    break;
            }
        }

        if ($.inArray(App.currentViewType, viewVariants) === -1) {
            App.currentViewType = '';
            viewType = '';
        } else {
            viewType = App.currentViewType;
        }

        return viewType;
    };

    var applyDefaults = function () {
        $(document).on('keydown', '.ui-dialog', function (e) {
            if ($(e.target).get(0).tagName.toLowerCase() == 'textarea') {
                return;
            }
            switch (e.which) {
                case 27:
                    $('.edit-dialog').remove();
                    break;
                case 13:
                    $('.ui-dialog-buttonset .ui-button').eq(0).trigger('click');
                    break;
                default:
                    break;
            }
        });

        $(document).on('keypress', '.onlyNumber', function (e) {
            var charCode = (e.which) ? e.which : e.keyCode;

            if (charCode > 31 && (charCode < 48 || charCode > 57)) {

                return false;
            }
            return true;
        });

        $(window).on('resize', function (e) {
            $('#ui-datepicker-div').hide();
        });
    };

    var navigateToDefaultUrl = function (options) {
        var defaultLocation = '#qualPro/' + CONSTANTS.ACTIVITYLIST;
        var url = Backbone.history.fragment || defaultLocation;

        if (url === 'qualPro') {
            url = defaultLocation;
        }

        Backbone.history.navigate(url, options);
    };

    var dateFormater = function (formatString, dateString) {
        var date = moment(dateString);
        var isRender = (App && App.render);
        var currentLanguage = (App && App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

        if ((!date || date === 'Invalid date') && isRender) {
            App.render({type: 'error', message: ERROR_MESSAGES.invalidDate[currentLanguage]});
        }

        return moment(dateString).format(formatString);
    };

    return {
        runApplication      : runApplication,
        getCurrentVT        : getCurrentVT,
        getCurrentTab       : getCurrentTab,
        applyDefaults       : applyDefaults,
        navigateToDefaultUrl: navigateToDefaultUrl,
        dateFormater        : dateFormater
    };
});