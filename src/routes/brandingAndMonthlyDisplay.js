const express = require('express');
const checkAuth = require('./../helpers/access').checkAuth;
const handlers = require('./../handlers/brandingAndMonthlyDisplay');

const router = express.Router();

router.use(checkAuth);
router.get('/:id([0-9a-fA-F]{24})', handlers.getById);
router.get('/', handlers.getAll);
router.put('/:id([0-9a-fA-F]{24})', handlers.update);
router.delete('/:id([0-9a-fA-F]{24})', handlers.removeItem);

module.exports = router;
