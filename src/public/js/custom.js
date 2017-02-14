define([
    'backbone',
    'jQuery',
    'async',
    'dataService',
    'moment',
    'constants/contentType',
    'constants/errorMessages',
    'constants/aclRoleIndexes',
    'services/pubnub'
], function (Backbone, $, async, dataService, moment, CONSTANTS, ERROR_MESSAGES, ACL_ROLE_INDEXES, PubNubClient) {

    var runApplication = function (success) {
        var url;

        if (!Backbone.History.started) {
            Backbone.history.start({silent: true});
        }

        if (!success) {
            return getCurrentUserFails();
        }

        function getCurrentUserFails() {
            if (App.requestedURL === null) {
                App.requestedURL = Backbone.history.fragment === 'login/confirmed' ? null : Backbone.history.fragment;
            }

            Backbone.history.fragment = '';
            return Backbone.history.navigate('login', {trigger: true});
        }

        function loadUrl(success) {
            if (success) {
                url = Backbone.history.fragment;

                if ((url === '') || (url === 'login')) {
                    url = 'qualPro';
                    if (App.currentUser.accessRole.level == ACL_ROLE_INDEXES.MASTER_UPLOADER || App.currentUser.accessRole.level === ACL_ROLE_INDEXES.COUNTRY_UPLOADER) {
                        url = 'qualPro/domain/country';
                    }
                }

                Backbone.history.fragment = "";
                Backbone.history.navigate(url, {trigger: true});
            }
        }

        require(['models/personnel'], (PersonnelModel) => {
            if (!App.currentUser) {
                const currentUser = new PersonnelModel();
                currentUser.url = '/personnel/currentUser';
                currentUser.fetch({
                    success: function (currentUser) {
                        var currentUser = currentUser.toJSON();
                        var userId = currentUser._id;

                        App.currentUser = currentUser;
                        $.datepicker.setDefaults($.datepicker.regional[currentUser.currentLanguage]);
                        moment.locale(currentUser.currentLanguage);
                        loadUrl(success);
                        App.socket.emit('save_socket_connection', { uId: userId });

                        PubNubClient.subscribe({
                            userId: userId
                        });
                    },

                    error: function (err) {
                        const status = err.status;
                        switch (status) {
                            case 401 :
                                getCurrentUserFails();
                                break;
                            default : break;
                        }
                    }
                });
            } else {
                loadUrl(success);
                App.socket.emit('save_socket_connection', {uId: App.currentUser._id});
            }
        });
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
