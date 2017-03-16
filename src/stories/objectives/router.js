const express = require('express');
const access = require('../../helpers/access');
const multipart = require('connect-multiparty');

const createSubObjective = require('./routes/createSubObjective');
const create = require('./routes/create');
const update = require('./routes/update');
const getPersonnelForSelection = require('./routes/getPersonnelForSelection');
const getUrl = require('./routes/getUrl');
const getAll = require('./routes/getAll');
const getByIdForObjectiveTreePreview = require('./routes/getByIdForObjectiveTreePreview');
const getByIdHistory = require('./routes/getByIdHistory');
const getById = require('./routes/getById');
const removeFileFromObjective = require('./routes/removeFileFromObjective');
const deleteByIds = require('./routes/deleteByIds');
const getAllForSync = require('./routes/getAllForSync');

const router = express.Router();
const multipartMiddleware = multipart();
const onLeaveMiddleware = require('../../utils/onLeaveMiddleware');

const checkAuth = access.checkAuth;

router.use(checkAuth);

router.post('/subObjective', multipartMiddleware, onLeaveMiddleware, createSubObjective);
router.post('/', multipartMiddleware, onLeaveMiddleware, create);
router.put('/:id([0-9a-fA-F]{24})', multipartMiddleware, onLeaveMiddleware, update);
router.patch('/:id([0-9a-fA-F]{24})', multipartMiddleware, onLeaveMiddleware, update);

router.get('/personnelFroSelection', getPersonnelForSelection);
router.get('/url/:imageName', getUrl); // TODO: remove this, only for testing

router.get('/', getAll);
router.get('/sync', getAllForSync);
router.get('/tree/:id([0-9a-fA-F]{24})', getByIdForObjectiveTreePreview);
router.get('/history/:id([0-9a-fA-F]{24})', getByIdHistory);
router.get('/:id([0-9a-fA-F]{24})', getById);

router.delete('/file', onLeaveMiddleware, removeFileFromObjective);
router.delete('/', onLeaveMiddleware, deleteByIds);

module.exports = router;
