const _ = require('lodash');
const simple = require('simple-mock');
const should = require('should');
const options = {
  to: 'dev@praece.com',
  cc: 'kevinob11@gmail.com',
  alwaysSendTo: 'kevin.obrien@praece.com',
  subject: 'Testing Email!',
  template: 'sampleEmail',
  data: {
    person: {
      firstName: 'Kevin',
      lastName: 'OBrien'
    },
    list: {
      items: ['Fish', 'Cat', 'Dog', 'Turtle'],
      title: 'Pets'
    }
  }
};

describe('Email', () => {
  it('Test normalizing options', normalizeOptions);
  it('Test email sending', sendEmail);
});

function normalizeOptions() {
  this.timeout(5000);
  
  const data = _.cloneDeep(options.data);
  const template = options.template;
  const cleanOptions = _.omit(options, ['data', 'template']);
  const spy = simple.mock(sails.hooks.email, 'normalizeOptions');

  return Promise.resolve()
    .then(() => {
      return sails.hooks.email.send(template, data, cleanOptions);
    })
    .then(() => {
      should.deepEqual(spy.lastCall.returned, options);
    });
}

function sendEmail() {
  this.timeout(5000);

  return sails.hooks.email.send(options);
}
