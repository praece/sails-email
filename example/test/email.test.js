const email = require('../../');
const options = {
  to: 'dev@praece.com',
  cc: 'kevinob11@gmail.com',
  alwaysSendTo: 'kevin.obrien@praece.com',
  subject: 'Testing Email!',
  template: 'sampleEmail',
  data: {
    name: 'Kevin OBrien',
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

  return email.send(options);
}
