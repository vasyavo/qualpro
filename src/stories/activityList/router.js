const access = require('../../helpers/access');
const Router = require('express').Router;

const router = new Router();

router.use(access.checkAuth);

router.get('/', require('./routes/getAll'));

router.get('/sync', require('./routes/getAllForSync'));

router.get('/badge', require('./routes/getBadge'));

router.delete('/badge', require('./routes/deleteBadge'));

module.exports = router;
