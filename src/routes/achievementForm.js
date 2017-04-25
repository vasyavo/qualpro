var express = require('express');
var router = express.Router();
var AchievementForm = require('../handlers/achievementForm');
var access = require('../helpers/access');

module.exports = function () {
    var handler = new AchievementForm();
    var checkAuth = access.checkAuth;

    router.use(checkAuth);

    router.get('/', handler.getAll);
    router.get('/:id([0-9a-fA-F]{24})', handler.getById);
    router.put('/:id([0-9a-fA-F]{24})', handler.update);

    return router;
};
