const request = require('supertest-as-promised');
const server = require('./server');

const agentSu = request.agent(server);
const agentMaster = request.agent(server);
const countryAdmin = request.agent(server);
const areaManager = request.agent(server);
const merchandiser = request.agent(server);

module.exports = {
    su: agentSu,
    master: agentMaster,
    countryAdmin,
    areaManager,
    merchandiser
};