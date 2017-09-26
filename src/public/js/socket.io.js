var Backbone = require('backbone');
var io = require('socket.io-client');
var PersonnelModel = require('./models/personnel');
var ERROR_MESSAGES = require('./constants/errorMessages');
var App = require('./appState');

var socket = io.connect({
    upgrade: false,
    transports: ['websocket'],
});

socket.on('connect', function () {
    if (App.currentUser) {
        socket.emit('save_socket_connection', {uId: App.currentUser._id});
    }
});

socket.on('onLeave', function () {
    var url = window.location.hash;
    var splitedUrl = url.split('/', 3);
    var currentUser = new PersonnelModel();
    var currentLanguage;
    currentUser.url = '/personnel/currentUser';
    currentUser.fetch({
        success: function (currentUser) {
            App.currentUser = currentUser.toJSON();
            currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
            if (['objectives', 'inStoreTasks'].indexOf(splitedUrl[1]) !== -1 && splitedUrl[2] === 'myCover') {
                App.render({type: 'alert', message: ERROR_MESSAGES.renderYourPage[currentLanguage]});
            }
        },
        error  : function (xhr, err) {
            App.render({
                type   : 'error',
                message: ERROR_MESSAGES.canNotFetchCurrentUser.en + '</br>' + ERROR_MESSAGES.canNotFetchCurrentUser.ar
            });
        }
    });
});

socket.on('notificationCountChange', function (data) {
    App.setMenuNotificationCount(data.count);
});

socket.on('logOut', function () {
    $.get('/logout', function () {
        delete App.currentUser;
        App.render({
            type   : 'notification',
            message: ERROR_MESSAGES.youAreOnLeave.en + '</br>' + ERROR_MESSAGES.youAreOnLeave.ar
        });
        Backbone.history.navigate('/login', {trigger: true});
    });

});

App.socket = socket;
