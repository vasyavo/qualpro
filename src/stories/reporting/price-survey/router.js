const express = require('express');
const handlers = require('./handlers');
const isAuth = require('../../../helpers/access').checkAuth;

const router = express.Router();

router.use(isAuth);
router.get('/brands', handlers.getBrands);
router.get('/', handlers.getAll);
router.get('/:id([0-9a-fA-F]{24})', handlers.getById);
router.post('/', handlers.create);
router.put('/:id([0-9a-fA-F]{24})/item/:itemId([0-9a-fA-F]{24})', handlers.update);
router.delete('/:id([0-9a-fA-F]{24})/item/:itemId([0-9a-fA-F]{24})', handlers.removeItem);

module.exports = router;
