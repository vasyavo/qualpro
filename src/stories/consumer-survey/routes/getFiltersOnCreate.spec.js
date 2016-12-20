const Promise = require('bluebird');
const expect = require('chai').expect;
const async = require('async');
const mongoose = require('mongoose');
const _ = require('lodash');
const ObjectId = require('bson-objectid');
const request = require('supertest-as-promised');
const server = require('./../../../server');
const faker = require('faker');
const logger = require('./../../../utils/logger');

const Authenticator = require('./../../../authenticator');

describe('get filters on create', () => {

    it('should works', function * () {
        const resp = yield Authenticator.master
            .get('/consumer-survey/filters-on-create')
            .send({})
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
            .and.include.all.keys(['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']);

        _.forOwn(body, (prop) => {
            expect(prop).to.be.an('Array')
                .and.have.lengthOf(1);
            expect(_.first(prop)).to.be.an('Object')
                .and.include.all.keys(['_id', 'name']);
        });
    });

});
