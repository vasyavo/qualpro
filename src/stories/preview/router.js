const access = require('../../helpers/access');
const Router = require('express').Router;

const router = new Router();

router.use(access.checkAuth);

router.get('/:id', require('./routes/getById'));

module.exports = router;
