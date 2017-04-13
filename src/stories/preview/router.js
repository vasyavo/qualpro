const access = require('../../helpers/access');
const Router = require('express').Router;

const router = new Router();

router.use(access.checkAuth);

router.post('/sync', require('./routes/getForSync'));

router.get('/:id([0-9a-fA-F]{24})', require('./routes/getById'));

module.exports = router;
