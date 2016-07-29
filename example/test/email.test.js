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
  it('Test email sending', sendEmail);
});

function sendEmail() {
  this.timeout(5000);

  return sails.hooks.email.send(options);
}
