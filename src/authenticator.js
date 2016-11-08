const request = require('supertest-as-promised');
const server = require('./server');

const agentSu = request.agent(server);
const agentMaster = request.agent(server);

module.exports = {
    su: agentSu,
    master: agentMaster
};
