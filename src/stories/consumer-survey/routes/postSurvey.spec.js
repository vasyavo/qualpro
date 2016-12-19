const Promise = require('bluebird');
const expect = require('chai').expect;
const async = require('async');
const mongoose = require('mongoose');
const ObjectId = require('bson-objectid');
const request = require('supertest-as-promised');
const server = require('./../../../server');
const faker = require('faker');

const DomainModel = require('./../../../types/domain/model');
const RetailSegmentModel = require('./../../../types/retailSegment/model');
const OutletModel = require('./../../../types/outlet/model');
const BranchModel = require('./../../../types/branch/model');

const Authenticator = require('./../../../authenticator');

describe('post', () => {
    const domainCountrySample = {
        _id: `${ObjectId()}`,
        name: {
            en: 'UNITED ARAB EMIRATES',
        },
        type: 'country',
    };
    const domainRegionSample = {
        _id: `${ObjectId()}`,
        name: {
            en: 'DUBAI',
        },
        type: 'region',
        parent: domainCountrySample._id,
    };
    const domainSubRegionSample = {
        _id: `${ObjectId()}`,
        name: {
            en: 'DUBAI',
        },
        type: 'subRegion',
        parent: domainRegionSample._id,
    };
    const retailSegmentSample = {
        _id: `${ObjectId()}`,
        name: {
            en: 'Segment C',
        },
        subRegions: [domainSubRegionSample._id],
    };
    const outletSample = {
        _id: `${ObjectId()}`,
        name: {
            en: 'Kefir',
        },
        subRegions: [domainSubRegionSample._id],
        retailSegments: [retailSegmentSample._id],
    };
    const branchSample = {
        _id: `${ObjectId()}`,
        name: {
            en: 'Kefir',
        },
        address: {
            en: 'Uzhhorod, Svobody Ave 40'
        },
        subRegion: domainSubRegionSample._id,
        retailSegment: retailSegmentSample._id,
        outlet: outletSample._id,
    };
    const surveySample = {
        title: {
            en: 'test survey',
        },
        dueDate: Date.now(),
        status: 'draft',
        location: {
            en: `${domainCountrySample.name.en} > ${domainRegionSample.name.en} > ${domainSubRegionSample.name.en}`,
        },
        country: [domainCountrySample._id],
        region: [domainRegionSample._id],
        subRegion: [domainSubRegionSample._id],
        retailSegment: [retailSegmentSample._id],
        outlet: [outletSample._id],
        branch: [branchSample._id],
    };

    before(function * () {
        yield Promise.each([
            domainCountrySample,
            domainRegionSample,
            domainSubRegionSample
        ], (item) => {
            const domainModel = new DomainModel();

            domainModel.set(item);
            return domainModel.save();
        });

        const retailSegmentModel = new RetailSegmentModel();
        retailSegmentModel.set(retailSegmentSample);
        yield retailSegmentModel.save();

        const outletModel = new OutletModel();
        outletModel.set(outletSample);
        yield outletModel.save();

        const branchModel = new BranchModel();
        branchModel.set(branchSample);
        yield branchModel.save();
    });

    it('should works', function * () {
        const resp = yield Authenticator.master
            .post('/consumer-survey')
            .send(surveySample)
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object');
        expect(body).to.have.property('title')
            .and.have.property('en')
            .and.be.a('String');
        expect(body).to.have.property('location')
            .and.have.property('en')
            .and.be.a('String');

        expect(body.country).to.be.an('Array').and.have.lengthOf(1);
        expect(body.country[0]).have.property('_id')
            .and.be.equals(domainCountrySample._id);

        expect(body.region).to.be.an('Array').and.have.lengthOf(1);
        expect(body.region[0]).have.property('_id')
            .and.be.equals(domainRegionSample._id);

        expect(body.subRegion).to.be.an('Array').and.have.lengthOf(1);
        expect(body.subRegion[0]).have.property('_id')
            .and.be.equals(domainSubRegionSample._id);

        expect(body.retailSegment).to.be.an('Array').and.have.lengthOf(1);
        expect(body.retailSegment[0]).have.property('_id')
            .and.be.equals(retailSegmentSample._id);

        expect(body.outlet).to.be.an('Array').and.have.lengthOf(1);
        expect(body.outlet[0]).have.property('_id')
            .and.be.equals(outletSample._id);

        expect(body.branch).to.be.an('Array').and.have.lengthOf(1);
        expect(body.branch[0]).have.property('_id')
            .and.be.equals(branchSample._id);
    });

});
