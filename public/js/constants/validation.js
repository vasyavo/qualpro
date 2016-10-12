(function () {
    var root;

    var VALIDATION = {
        EMAIL_REGEXP: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        PHONE_REGEXP: /^[0-9\+]?([0-9-\s()])+[0-9()]$/,
        DISPLAY_PHONE_REGEXP: /^(\d{3})?(\d{2})?(\d{3})?(\d{4}$)?/,
        OBJECT_ID: new RegExp('(^[0-9a-fA-F]{24}$)')
    };

    if (typeof window == 'object' && this === window) {
        root = window;
    }
    else if (typeof global == 'object' && this === global) {
        root = global;
    }
    else {
        root = this;
    }

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = VALIDATION;
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return VALIDATION;
        });
    } else {
        root.VALIDATION = VALIDATION;
    }

}());
