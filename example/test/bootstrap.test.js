const Sails = require('sails/lib/app');
const Promise = require('bluebird');
const rc = require('rc');
const _ = require('lodash');

before(beforeTests);

function beforeTests(done) {
  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(20000);

  lower()
    .then(() => lift())
    .then(() => done(), done);
}

function lift() {
  return new Promise((resolve, reject) => {
    const app = Sails();

    app.lift({
      port: _.includes(process.argv, '--lift') ? 1337 : 1339,
      log: {
        level: 'info',
        noShip: true
      },
      hooks: { grunt: false }
    }, err => {
      if (err) reject(err);

      resolve();
    });
  });
}

function lower() {
  if (typeof sails === 'undefined') return Promise.resolve();

  return new Promise((resolve, reject) => {
    sails.lower(err => {
      if (err) reject(err);

      resolve();
    });
  });
}
