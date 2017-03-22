const express = require('express');
const access = require('../../helpers/access');
const multipart = require('connect-multiparty');
const onLeaveMiddleware = require('../../utils/onLeaveMiddleware');

const personnelForSelection = require('./routes/personnelForSelection');
const duplicateInStoreTask = require('./routes/duplicateInStoreTask');
const create = require('./routes/create');
const update = require('./routes/update');
const getByIdTaskFlow = require('./routes/getByIdTaskFlow');
const getById = require('./routes/getById');
const getAll = require('./routes/getAll');
const removeFileFromInStoreTask = require('./routes/removeFileFromInStoreTask');
const getAllForSync = require('./routes/getAllForSync');

const router = express.Router();
const multipartMiddleware = multipart();
const checkAuth = access.checkAuth;

router.use(checkAuth);

router.get('/personnelFroSelection', onLeaveMiddleware, personnelForSelection);

router.post('/duplicate', onLeaveMiddleware, duplicateInStoreTask);

router.post('/', multipartMiddleware, onLeaveMiddleware, create);

router.put('/:id([0-9a-fA-F]{24})', multipartMiddleware, onLeaveMiddleware, update);
router.patch('/:id([0-9a-fA-F]{24})', multipartMiddleware, onLeaveMiddleware, update);

router.get('/taskFlow/:id([0-9a-fA-F]{24})', getByIdTaskFlow);

router.get('/:id([0-9a-fA-F]{24})', getById);

router.get('/', getAll);

router.get('/sync', getAllForSync);

router.delete('/file', onLeaveMiddleware, removeFileFromInStoreTask);

module.exports = router;
