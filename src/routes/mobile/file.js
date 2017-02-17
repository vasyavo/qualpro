/**
 * @module Mobile - File
 */


var express = require('express');
var router = express.Router();
var access = require('../../helpers/access');

var Handler = require('../../handlers/file');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/mobile/file/:bucket/:id`
     *
     * Returns existing `file` by id
     *
     * @see {@link FileModel}
     *
     * @example Request example:
     *     'http://194.42.200.114:9797/mobile/file/objectives/571e3a1524f3639c049439ca'
     *
     * @example Response example:
     *
     *  {
     *      "_id": "571e3a1524f3639c049439ca",
     *      "contentType": "image/jpeg",
     *      "extension": "jpg",
     *      "originalName": "panda",
     *      "name": "571e3a1424f3639c049439c9.jpg",
     *      "url": "http://194.42.200.114:9797/files/objectives/571e3a1424f3639c049439c9.jpg"
     *  }
     *
     * @method /mobile/file/:bucket/:id
     * @instance
     */

    router.get('/:bucket/:id', handler.getById);

    router.post('/', multipartMiddleware, handler.uploadFileHandler);

    return router;
};


