const access = require('../../helpers/access');
const Router = require('express').Router;

const router = new Router();

router.use(access.checkAuth);

router.post('/', require('./routes/post'));

router.patch('/:id', require('./routes/put'));

router.post('/answer', require('./routes/postAnswer'));

router.get('/', (req, res, next) => {
    const isMobile = req.isMobile;
    let rout;

    if (isMobile) {
        rout = require('./routes/getForMobile');
    } else {
        rout = require('./routes/get');
    }

    rout(req, res, next);
});
router.get('/sync', require('./routes/sync'));
router.put('/answer/:id([0-9a-fA-F]{24})', require('./routes/editAnswer'));
router.delete('/answer/:id([0-9a-fA-F]{24})', require('./routes/removeAnswer'));
router.get('/answer', require('./routes/getAnswers'));
router.get('/:id', require('./routes/getOne'));

module.exports = router;
