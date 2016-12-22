const access = require('../../helpers/access');
const Router = require('express').Router;

const router = new Router();

router.use(access.checkAuth);

router.post('/', require('./routes/post'));
router.patch('/:id', require('./routes/put'));
router.post('/answer', require('./routes/postAnswer'));
router.get('/', require('./routes/get'));
router.get('/answer', require('./routes/getAnswers'));
router.get('/:id', require('./routes/getOne'));


module.exports = router;
