/**
 * @module Display Type
 */

var express = require('express');
var router = express.Router();
var access = require('../helpers/access');
var Handler = require('../handlers/displayType');

module.exports = function() {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);


    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/displayType`
     *
     * Returns the all existing `Display Types`
     *
     * @see {@link displayTypeModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/displayType'
     *
     * @example Response example:
     *
     * {
     *     "data": [{
     *         "_id": 1,
     *         "name": {
     *             "en": "Shelf",
     *             "ar": "رف"
     *         }
     *     }, {
     *         "_id": 2,
     *         "name": {
     *             "en": "Block",
     *             "ar": "قاطع"
     *         }
     *     }, {
     *         "_id": 3,
     *         "name": {
     *             "en": "Gondola Head",
     *             "ar": "جندولة أمامية"
     *         }
     *     }, {
     *         "_id": 4,
     *         "name": {
     *             "en": "Gondola End",
     *             "ar": "جندولة خلفية"
     *         }
     *     }, {
     *         "_id": 5,
     *         "name": {
     *             "en": "Gondola",
     *             "ar": "جندولة"
     *         }
     *     }, {
     *         "_id": 6,
     *         "name": {
     *             "en": "Side Gondola",
     *             "ar": "جندولة جانبية"
     *         }
     *     }, {
     *         "_id": 7,
     *         "name": {
     *             "en": "Pallet",
     *             "ar": "طبلية"
     *         }
     *     }, {
     *         "_id": 8,
     *         "name": {
     *             "en": "Floor Display",
     *             "ar": "مساحة عرض أرضية"
     *         }
     *     }, {
     *         "_id": 9,
     *         "name": {
     *             "en": "Podium",
     *             "ar": "بوديوم"
     *         }
     *     }, {
     *         "_id": 10,
     *         "name": {
     *             "en": "Element",
     *             "ar": "مساحة عرض اضافية"
     *         }
     *     }, {
     *         "_id": 11,
     *         "name": {
     *             "en": "Stand",
     *             "ar": "استاند"
     *         }
     *     }, {
     *         "_id": 12,
     *         "name": {
     *             "en": "Side Stand",
     *             "ar": "استاند جانبي"
     *         }
     *     }, {
     *         "_id": 13,
     *         "name": {
     *             "en": "Thematic Stand",
     *             "ar": "استاند خاص بحملة ترويج معينة"
     *         }
     *     }, {
     *         "_id": 14,
     *         "name": {
     *             "en": "Promoter Stand",
     *             "ar": "استاند خاص بالعارضات"
     *         }
     *     }, {
     *         "_id": 15,
     *         "name": {
     *             "en": "Basket",
     *             "ar": "سلة"
     *         }
     *     }, {
     *         "_id": 16,
     *         "name": {
     *             "en": "Other",
     *             "ar": "آخر"
     *         }
     *     }]
     * }
     *
     * @method /displayType
     * @instance
     */

    router.get('/', handler.getAll);

    return router;
};
