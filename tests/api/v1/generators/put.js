/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/api/v1/generators/put.js
 */
'use strict'; // eslint-disable-line strict

const supertest = require('supertest');
const api = supertest(require('../../../../index').app);
const constants = require('../../../../api/v1/constants');
const tu = require('../../../testUtils');
const u = require('./utils');
const Generator = tu.db.Generator;
const path = '/v1/generators';
const expect = require('chai').expect;
const ZERO = 0;

describe(`api: PUT ${path}`, () => {
  let token;
  let generatorId = 0;
  const generatorToCreate = u.getGenerator();
  before((done) => {
    tu.createToken()
    .then((returnedToken) => {
      token = returnedToken;
      done();
    })
    .catch(done);
  });

  before((done) => {
    Generator.create(generatorToCreate)
    .then((gen) => {
      generatorId = gen.id;
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  after(u.forceDelete);
  after(tu.forceDeleteUser);

  it('simple put: ok', (done) => {
    const toPut =
    { name: 'refocus-ok-generator',
      description: 'Collect status data',
      keywords: [
        'status',
        'STATUS'
      ],
      generatorTemplate: {
        name: 'refocus-ok-generator-template',
        version: '1.0.0'
      },
      context: {
        okValue: {
          required: false,
          default: '0',
          description: 'An ok sample\'s value, e.g. \'0\'',
        },
      },
      subjects: ['US'],
      aspects: ['Temperature', 'Weather'],
    };

    api.put(`${path}/${generatorId}`)
    .set('Authorization', token)
    .send(toPut)
    .expect(constants.httpStatus.OK)
    .expect((res) => {
      expect(res.body.subjectQuery).to.equal(undefined);
      expect(res.body.subjects).to.deep.equal(toPut.subjects);
    })
    .end((err /* , res */) => {
      return err ? done(err) : done();
    });
  });

  it('simple put with name in the url should work', (done) => {
    const toPut =
    { name: 'refocus-ok-generator',
      description: 'Collect status data patched with name',
      keywords: [
        'status',
        'STATUS'
      ],
      generatorTemplate: {
        name: 'refocus-ok-generator-template',
        version: '1.0.0'
      },
      context: {
        okValue: {
          required: false,
          default: '0',
          description: 'An ok sample\'s value, e.g. \'0\'',
        },
      },
      subjects: ['US'],
      aspects: ['Temperature', 'Weather'],
    };

    api.put(`${path}/${toPut.name}`)
    .set('Authorization', token)
    .send(toPut)
    .expect(constants.httpStatus.OK)
    .expect((res) => {
      expect(res.body.description).to.equal(toPut.description);
    })
    .end((err /* , res */) => {
      return err ? done(err) : done();
    });
  });

  it('put without the required field: aspects', (done) => {
    const toPut =
    { name: 'refocus-ok-generator',
      description: 'Collect status data',
      keywords: [
        'status',
        'STATUS'
      ],
      generatorTemplate: {
        name: 'refocus-ok-generator-template',
        version: '1.0.0'
      },
      context: {
        okValue: {
          required: false,
          default: '0',
          description: 'An ok sample\'s value, e.g. \'0\'',
        },
      },
      subjects: ['US'],
    };

    api.put(`${path}/${generatorId}`)
    .set('Authorization', token)
    .send(toPut)
    .expect(constants.httpStatus.OK)
    .end((err, res) => {
      if (!err) {
        done('Expecting "Schema Validation Failed" error');
      }
      const errorArray = JSON.parse(res.text).errors;
      expect(errorArray.length).to.equal(1);
      expect(errorArray[ZERO].type).to.equal('SCHEMA_VALIDATION_FAILED');
      return done();
    });
  });
});