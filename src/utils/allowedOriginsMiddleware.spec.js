const expect = require('chai').expect;
const request = require('superagent');

describe('server scheduler', () => {

    it('should create request', function (done) {
        request
            .post('http://localhost:3000/scheduler/')
            .set('Accept', 'application/json')
            .set('User-Agent', 'Super Agent/0.0.1')
            .set('referer', 'http://www.google.com')
            .send({ date: 'Fri Dec 30 2016 10:36:24 GMT+0200 (EET)'})
            .end(function(err, res){
               if (err){
                   throw err
               }
                console.log(res);
                done();
            });
    });

});
