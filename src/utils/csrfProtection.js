const csurf = require('csurf');

const csrfProtection = csurf({
    ignoreMethods : ['GET', 'POST'],
    cookie : true
});

module.exports = csrfProtection;
