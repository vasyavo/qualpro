// Filename: app.js
define(['jQuery',
    'router',
    'communication',
    'custom',
    'ckeditor-core',
    'socket.io',
    'scrollBar',
    'rater',
    'jquery-rater',
    'tree',
    'ckeditor-jquery',
    'jquery-masked-field'
], function ($, Router, Communication, Custom, CKEDITOR, io) {
    var CSRF_TOKEN = $('meta[name="csrf-token"]').attr('content');

    var initialize = function () {
        var appRouter = new Router();

        $('html').click(function (e) {
            if (!$(e.target).hasClass('filterElement')) {
                $('.dropDownContent').removeClass('showActionDropDown');
                $('.filterBar .dropDownContent').hide();
            }
        });

        if (!Array.prototype.last) {
            Array.prototype.last = function () {
                return this[this.length - 1];
            };
        }

        appRouter.checkLogin = Communication.checkLogin;
        Communication.checkLogin(Custom.runApplication);
    };
    var applyDefaults = function () {
        CKEDITOR.config.customConfig = '../../helpers/ckeditor/config.js';

        $.fn.fadeFn = function (options) {
            var visibleState = options.visibleState;
            var count = options.count;
            var addClassTransparent = !!options.transparent && !!visibleState;
            var $curEl = this;
            var curDuration = visibleState ? 0 : 500;
            var currentFunction = visibleState ? 'fadeIn' : 'fadeOut';
            setTimeout(function () {
                $($curEl)[currentFunction](curDuration);
                $($curEl).toggleClass('transparent', addClassTransparent);
            }, count || 0);
        };

        //add startsWith function to strings
        if (typeof String.prototype.startsWith !== 'function') {
            String.prototype.startsWith = function (str) {
                if (str === 'All') {
                    return true;
                }

                if (str === '0-9') {
                    return !isNaN(parseInt(this[0]));
                }

                return this.indexOf(str) === 0;
            };
        }

        $.extend($.mCustomScrollbar.defaults, {
            scrollButtons: {
                enable      : true,
                scrollAmount: 10
            },

            theme: 'qualPro'
        });

        // star rating plugin default options
        $.extend($.fn.rate.settings, {
            readonly            : true,
            symbols             : {
                qualProStar: {
                    base    : '\u2605',
                    hover   : '\u2605',
                    selected: '\u2605'
                },
                qualProCube: {
                    base    : '\u25A1',
                    hover   : '\u25A0',
                    selected: '\u25A0'
                }
            },
            selected_symbol_type: 'qualProStar'
        });

        $.fn.rateProgress = function (complete) {
            complete = complete || 0;

            $(this).rate({
                readonly            : true,
                selected_symbol_type: 'qualProCube',
                max_value           : 10,
                initial_value       : complete / 10
            });
        };

        // rating to name jquery function
        $.fn.rateName = function (params) {
            var defaults = {
                rateList: [
                    {_id: 1, name: 'New'},
                    {_id: 2, name: 'Below Standard'},
                    {_id: 3, name: 'Standard'},
                    {_id: 4, name: 'Superior'},
                    {_id: 5, name: 'Exceptional'}
                ]
            };
            var options = $.extend({}, defaults, params);
            var optionsRateList = options.rateList;
            var rateList = {};

            for (var i = optionsRateList.length - 1;
                 i > 0;
                 i--) {
                rateList[optionsRateList[i]._id] = optionsRateList[i].name;
            }

            this.each(function () {
                var rate = +$(this).attr('data-rate-value');
                rate = Math.round(rate);
                if (!isNaN(parseFloat(rate)) && isFinite(rate) && rate >= 1 && rate <= 5) {
                    $(this).html(rateList[rate]);
                } else {
                    $(this).html('Not rated');
                }
            });

            return this;
        };

        $.extend($.fn.barrating.defaults, {
            theme             : 'css-stars',
            showSelectedRating: false
        });

        $.extend($.ui.dialog.prototype.options, {
            closeOnEscape: true,
            modal        : true,
            resizable    : false,
            draggable    : true,
            autoOpen     : true,
            width        : 'auto',
            height       : 'auto',
            appendTo     : '#dialogHandler',
            showCancelBtn: true,
            buttons      : {},
            create       : function () {
                var options = $(this).dialog('option');
                var buttons = options.buttons;
                var currentUser = App.currentUser;
                var currentLanguage = currentUser && currentUser.currentLanguage || 'en';
                var cancelText = (currentLanguage === 'en') ? 'Cancel' : 'إلغاء';
                var cancelFunction;

                $(this).dialog('option', 'dialogClass', 'allDialogsClass ' + (options.dialogClass || ''));

                if (buttons && buttons.cancel) {
                    cancelText = buttons.cancel.text;
                    cancelFunction = buttons.cancel.click;

                    delete buttons.cancel;
                }

                $('body').css({overflow: 'hidden'});

                if (buttons.save) {
                    buttons.save.class = 'btn acceptBtn';
                }

                if (options.showCancelBtn) {
                    $.extend(buttons, {
                        cancel: {
                            text : cancelText || 'Cancel',
                            class: 'btn cancelBtn',
                            click: function () {
                                if (cancelFunction && typeof cancelFunction === 'function') {
                                    cancelFunction();
                                }
                                $(this).dialog('close').dialog('destroy').remove();
                            }
                        }
                    });

                    $(this).dialog('option', 'buttons', buttons);
                }
            },

            close: function () {
                $('body').css({overflow: 'inherit'});
            }
        });

        $.datepicker.regional.ar = {
            closeText  : 'إغلاق',
            prevText   : '&#x3C;السابق',
            nextText   : 'التالي&#x3E;',
            currentText: 'اليوم',

            monthNames: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],

            monthNamesShort   : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            dayNames          : ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
            dayNamesShort     : ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
            dayNamesMin       : ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
            weekHeader        : 'أسبوع',
            dateFormat        : 'dd.mm.yy',
            firstDay          : 0,
            isRTL             : true,
            showMonthAfterYear: false,
            yearSuffix        : ''
        };

        $.datepicker.regional.en = {
            closeText  : 'Done',
            prevText   : 'Prev',
            nextText   : 'Next',
            currentText: 'Today',

            monthNames: ['January', 'February', 'March', 'April',
                'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'],

            monthNamesShort   : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            dayNames          : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            dayNamesShort     : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            dayNamesMin       : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            weekHeader        : 'Wk',
            dateFormat        : 'dd.mm.yy',
            firstDay          : 1,
            isRTL             : false,
            showMonthAfterYear: false,
            yearSuffix        : ''
        };

        $.ajaxSetup({
            headers: {
                'X-CSRF-Token': CSRF_TOKEN,
                'clientdate'  : new Date()
            }
        });

    };

    return {
        initialize   : initialize,
        applyDefaults: applyDefaults
    };
});
