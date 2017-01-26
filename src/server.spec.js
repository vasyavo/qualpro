require('./testSetup.spec');
const expect = require('chai').expect;
const request = require('supertest-as-promised');
require('./master');
const server = require('./app');

describe('how server works', () => {

    it('server should up', function * () {
        yield request(server)
            .get('/info')
            .send({})
            .expect(200, {
                isAlive: 'Yep'
            })
    });

});

require('./routes/mobileAuthentication.spec');
require('./routes/mobile/synchronization.spec');
require('./routes/mobile/roles.spec');
