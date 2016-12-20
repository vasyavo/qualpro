require('./validation/allowedBodyData');
require('./validation/validationFuntion');

const Router = require('express').Router;

const router = new Router();

router.get('/filters-on-create', require('./routes/getFiltersOnCreate'));
router.post('/', require('./routes/postSurvey'));
router.post('/answer', require('./routes/leaveAnswer'));

module.exports = router;
