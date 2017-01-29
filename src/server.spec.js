require('./testSetup.spec');
const request = require('supertest-as-promised');
require('./master');
const server = require('./app');

describe('how server works', () => {

    it('server should up', function(done) {
        request(server)
            .get('/info')
            .send({})
            .expect(200, {
                isAlive: 'Yep'
            });

        require('./modulesCreators')(done);
    });

});

require('./routes/mobileAuthentication.spec');
require('./routes/mobile/synchronization.spec');
require('./routes/mobile/roles.spec');
