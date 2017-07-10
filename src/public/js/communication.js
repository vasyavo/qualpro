define(function(require) {
    var $ = require('jQuery');

    var checkLogin = function (callback) {
        var url = "/authenticated";
        $.ajax({
            url: url,
            type: "GET",
            success: function () {
                return callback(true);
            },
            error: function (data) {
                return callback(false);
            }
        });
    };

    return {
        checkLogin: checkLogin
    };
});