const shell = require('shelljs');
const config = require('./../../config');
const spawnDefaults = require('./../../modulesCreators');
const expect = require('chai').expect;
const async = require('async');
const request = require('supertest-as-promised');
const server = require('./../../app');
const faker = require('faker');
const shortId = require('shortid');
const Authenticator = require('./../../authenticator');
const synch = require('./synch.helper');

const herokuAppEnv = process.env.HEROKU_APP_ENV;

describe('mobile synchronization', () => {

    describe('Master Admin', () => {

        synch.standardPack.forEach((item) => item.apply(null, [Authenticator.master]));

    });

    if (!config.isCI && config.pullDbOnCI) {
        describe('Staging database pulling', () => {

            it('should works', function(done) {
                const timeToPullDatabase = 60 * 10 * 1000;

                this.timeout(timeToPullDatabase);

                const pathToScript = `${config.workingDirectory}reproduce-${herokuAppEnv}-db.sh`;

                shell.chmod('+x', pathToScript);

                async.waterfall([

                    (cb) => {
                        shell.exec(pathToScript, { async: true }, (code, stdout, stderr) => {
                            if (code !== 0) {
                                return cb('Something wrong with database pulling');
                            }

                            cb();
                        });
                    },

                    (cb) => {
                        spawnDefaults(cb);
                    }

                ], (err) => {
                    if (err) {
                        return done(err);
                    }

                    done();
                });
            });

        });

        describe('Country Admin', () => {

            it('should pass authentication with password', function *() {
                const resp = yield Authenticator.countryAdmin
                    .post('/mobile/login')
                    .send({
                        login: 'ca_uae@yopmail.com', //todo change to variables
                        pass: '123456'
                    })
                    .expect(200);

                const body = resp.body;

                expect(body).to.be.an('Object')
            });

            synch.standardPack.forEach((item) => item.apply(null, [Authenticator.countryAdmin]));

        });

        describe('Area Manager', () => {

            it('should pass authentication with password', function *() {
                const resp = yield Authenticator.areaManager
                    .post('/mobile/login')
                    .send({
                        login: 'am_uae@yopmail.com', //todo change to variables
                        pass: '123456'
                    })
                    .expect(200);

                const body = resp.body;

                expect(body).to.be.an('Object')
            });

            synch.standardPack.forEach((item) => item.apply(null, [Authenticator.areaManager]));

        });

        describe('Merchandiser', () => {

            it('should pass authentication with password', function *() {
                const resp = yield Authenticator.merchandiser
                    .post('/mobile/login')
                    .send({
                        login: 'mc_uae@yopmail.com', //todo change to variables
                        pass: '123456'
                    })
                    .expect(200);

                const body = resp.body;

                expect(body).to.be.an('Object')
            });

            [
                ...synch.merchandiserPack,
                synch.shouldSyncQuestionnary
            ].forEach((item) => item.apply(null, [Authenticator.merchandiser]));

        });
    }

});
