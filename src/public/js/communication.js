var $ = require('jquery');

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

module.exports = {
    checkLogin: checkLogin
};
