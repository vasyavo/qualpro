(function () {
    var root;

    var STATUSES = {
        LOGIN: {
            _id : 'login',
            name: {
                en: 'Last Logged in',
                ar: 'آخر دخول في'
            }
        },

        ARCHIVED: {
            _id : 'archived',
            name: {
                en: 'Archived',
                ar: 'فى الارشيف'
            }
        },

        INACTIVE: {
            _id : 'inactive',
            name: {
                en: 'Inactive',
                ar: 'غير نشط'
            }
        },

        SENDPASS: {
            _id : 'sendPass',
            name: {
                en: 'Share Password',
                ar: 'ارسال كلمة المرور'
            }
        },

        ONLINE: {
            _id : 'online',
            name: {
                en: 'Online',
                ar: '' // todo translate
            }
        },

        NEVERLOGIN: {
            _id : 'neverLogin',
            name: {
                en: 'Never Logged in',
                ar: 'لم يتم تسجيل الدخول مطلقا'
            }
        },

        ONLEAVE: {
            _id : 'onLeave',
            name: {
                en: 'On Leave',
                ar: 'فى اجازة'
            }
        },

        TEMP: {
            _id : 'temp',
            name: {
                en: 'Temporary Employee',
                ar: 'موظف مؤقت'
            }
        }
    };

    if (typeof window === 'object' && this === window) {
        root = window;
    }
    else if (typeof global === 'object' && this === global) {
        root = global;
    }
    else {
        root = this;
    }

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = STATUSES;
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return STATUSES;
        });
    } else {
        root.STATUSES = STATUSES;
    }

}());