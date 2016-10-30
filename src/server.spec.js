const expect = require('chai').expect;
const request = require('supertest-as-promised');
const server = require('./server');

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
