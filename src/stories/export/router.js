const express = require('express');
const {wrap} = require('co');
const access = require('../../helpers/access');

const router = express.Router();
const checkAuth = access.checkAuth;

router.use(checkAuth);

router.get('/locations',
    checkAuth,
    wrap(require('./routes/exportLocations'))
);

router.get('/personnels',
    checkAuth,
    wrap(require('./routes/exportPersonnels'))
);

router.get('/competitor-items',
    checkAuth,
    wrap(require('./routes/exportCompetitorItems'))
);

router.get('/items',
    checkAuth,
    wrap(require('./routes/exportItems'))
);

module.exports = router;
