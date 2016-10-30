module.exports = (function () {
    var gcm = require('node-gcm');

    var gcmClass = function (googleApiKey) {

        var sender = new gcm.Sender(googleApiKey);
        var message = new gcm.Message();

        function sendPush(registrationIds, msg, options) {
            var sendingMessageObject = {};
            var timeToLive;
            var now;

            sendingMessageObject.message = msg;

            if (options && options.payload && typeof options.payload === 'object' && Object.keys(options.payload).length) {
                sendingMessageObject.payload = options.payload;
            }

            if (options && options.badge) {
                sendingMessageObject.badge = options.badge;
            }

            if (options && options.sound) {
                sendingMessageObject.sound = options.sound;
            }

            if (options && options.expirationDate) {
                now = Math.floor(Date.now() / 1000);
                timeToLive = options.expirationDate - now;

                if (timeToLive > 0) {
                    message.timeToLive = timeToLive;
                }
            }

            message.addData(sendingMessageObject);

            sender.send(message, registrationIds, 4, function (err, result) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('*********************Result GOOGLE**************************');
                    console.dir(result);
                    console.log('*********************-AFTER RESULT-***************************');
                }
            });
        }

        sender.sendPush = sendPush;

        return sender;
    };

    return gcmClass;
})();
