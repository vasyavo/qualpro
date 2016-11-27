const Router = require('express').Router;
const config = require('./../../config');
const mongo = require('./../../utils/mongo');
const redis = require('./../../helpers/redisClient');
const eventEmitter = require('./../../utils/eventEmitter');
const PersonnelHandler = require('./../../handlers/personnel');
const setIsMobileToMiddleware = require('./../../utils/setIsMobileToMiddleware');
const csrfProtection = require('./../../utils/csrfProtection');

const router = new Router();
const personnelHandler = new PersonnelHandler(mongo, redis, eventEmitter);

router.post('/login', csrfProtection, personnelHandler.login);
router.post('/mobile/login', setIsMobileToMiddleware, csrfProtection, personnelHandler.login);

router.post('/forgotPass', csrfProtection, personnelHandler.forgotPassword);

router.get('/logout', csrfProtection, personnelHandler.logout);
router.get('/mobile/logout', setIsMobileToMiddleware, csrfProtection, personnelHandler.logout);

const isAuthenticated = (req, res) => {
    if (req.session && req.session.loggedIn) {
        return res.send(200);
    }

    res.send(401);
};

router.get('/authenticated', isAuthenticated);

router.get('/passwordChange/:forgotToken', csrfProtection, (req, res) => {
    const forgotToken = req.params.forgotToken;

    res.render('changePassword', {
        host: config.localhost,
        forgotToken,
        csrfToken: req.csrfToken()
    });
});

router.get('/passwordChangeNotification/:messageObj', csrfProtection, (req, res) => {
    const messageObj = JSON.parse(req.params.messageObj);

    res.render('passwordChangeNotification', {
        host: config.localhost,
        messageObj
    });
});

router.get('/verificateCode/:phoneNumber', csrfProtection, (req, res) => {
    const phoneNumber = req.params.phoneNumber;

    res.render('enterCode.html', {
        host: config.localhost,
        csrfToken: req.csrfToken(),
        phoneNumber,
        sendSMSUrl: 'forgotPass'
    });
});
router.get('/messageSent', csrfProtection, (req, res) => {

    res.render('emailMessageWasSent.html', {
        host: config.localhost,
        csrfToken: req.csrfToken()
    });
});

module.exports = router;
