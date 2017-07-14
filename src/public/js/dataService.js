var $ = require('jQuery');

/**
 *
 * @param url Represent url that data service will use to get data
 * @param {Object} data Additional parameters of request. Data will be represented as query string
 * @param {cb} callback function.
 */
var getData = function (url, data, callback) {
    var regexp = new RegExp('/filters/', 'i');

    try {
        var dataAsString = JSON.stringify(data);
    } catch (ex) {
        return callback(ex);
    }

    if (regexp.test(url)) {
        return $.ajax({
            method: 'POST',
            url: url,
            data: {
                query: dataAsString
            },
            dataType: 'json',
            success: function (response) {
                callback(null, response);
            },
            error: function (jxhr) {
                callback(jxhr);
            }
        });
    }

    $.get(url, data, function (response) {
        callback(null, response);
    }).fail(function (jxhr) {
        callback(jxhr);
    });
};

/**
 *
 * @param {string} url Represent url that data service will use to post data
 * @param {Object} data Data to post
 * @param {cb} callback function
 */
var postData = function (url, data, callback) {
    sendData(url, data, 'POST', callback);
};

var putData = function (url, data, callback) {
    sendData(url, data, 'PUT', callback);
};

var deleteData = function (url, data, callback) {
    sendData(url, data, 'DELETE', callback);
};

var sendData = function (url, data, method, callback) {
    method = method.toUpperCase() || 'POST';
    $.ajax({
        url        : url,
        contentType: 'application/json',
        data       : JSON.stringify(data),
        type       : method,
        success    : function (response) {
            if (callback) {
                callback(null, response);
            }
        },
        error: function (jxhr) {
            if (callback) {
                callback(jxhr);
            }
        }
    });
};

module.exports = {
    getData   : getData,
    postData  : postData,
    putData   : putData,
    deleteData: deleteData
};
