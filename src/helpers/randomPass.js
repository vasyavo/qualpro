// JavaScript source code
var randomPass = (function randomPass() {
    //var uuid = require('node-uuid')();

    function randomNumber(m) {
        return Math.floor((Math.random() * m));
    };

    function generate(passLength) {
        var useTime = false;
        if (!passLength) {
            useTime = true;
            passLength = 50;
        }
        var now = (new Date()).valueOf();
        var alfabetical = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890' + now;
        var res = '';

        var doit = true;
        var i = 0;
        while (doit) {
            res += alfabetical.substr(randomNumber(alfabetical.length), 1);
            if (i === passLength) {
                doit = false;
            }
            i++;
        }
        if (!doit) {
            if (useTime) {
                return (res + now);
            }
            return res;
        }
    };

    function generateOnlyNumbersToken(length) {
        var numbers = '1234567890';
        var res = '';

        var doit = true;
        var i = 0;
        while (doit) {
            res += numbers.substr(randomNumber(numbers.length), 1);
            if (i === length - 1) {
                doit = false;
            }
            i++;
        }
        if (!doit) {
            return res;
        }
    };

    function generateUuid() {
        //var uuidLocal = uuid;
        //return uuidLocal;
    };

    function getTicksKey() {
        return new Date().getTime();
    };

    return {
        generate                : generate,
        getTicksKey             : getTicksKey,
        generateOnlyNumbersToken: generateOnlyNumbersToken
        // generateUuid: generateUuid
    };
})();

module.exports = randomPass;