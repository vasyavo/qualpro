var express = require('express');
var router = express.Router();
var access = require('../helpers/access');

var Handler = require('../handlers/currency');

module.exports = function () {
    var handler = new Handler();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    /**
     * __Type__ `GET`
     *
     * Base ___url___ for build __requests__ is `http:/<host>:<port>/currency/getForDD`
     *
     * Returns the all existing `currency`
     *
     * @see {@link CurrencyModel}
     *
     * @example Request example:
     *     'http://192.168.88.15:9797/currency/getForDD'
     *
     * @example Response example:
     *
     *  [{
     *      "_id": "AED",
     *      "name": "Dirham (AED)"
     *  },
     *  {
     *      "_id": "QAR",
     *      "name": "Qatari Riyal (QAR)"
     *  },
     *  {
     *      "_id": "SAR",
     *      "name": "Saudi Arabian Riyal (SAR)"
     *  },
     *  {
     *      "_id": "SDG",
     *      "name": "Sudanese Pound (SDG)"
     *  },
     *  {
     *      "_id": "SYP",
     *      "name": "Syrian Pound (SYP)"
     *  },
     *  {
     *      "_id": "YER",
     *      "name": "Emeni Rial (YER)"
     *  }]
     *
     * @method /currency/getForDD
     * @instance
     */

    router.get('/getForDD', handler.getForDD);

    return router;
};
