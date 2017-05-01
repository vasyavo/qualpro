const os = require('os');
const express = require('express');
const multer = require('multer');
const {wrap} = require('co');
const access = require('../../helpers/access');

const upload = multer({dest: os.tmpdir()});
const router = express.Router();

const checkAuth = access.checkAuth;

router.use(checkAuth);

router.post('/locations',
    checkAuth,
    upload.single('source'),
    wrap(require('./routes/importLocations'))
);

router.post('/personnels',
    checkAuth,
    upload.single('source'),
    wrap(require('./routes/importPersonnels'))
);

router.post('/competitor-items',
    checkAuth,
    upload.single('source'),
    wrap(require('./routes/importCompetitorItems'))
);

module.exports = router;
