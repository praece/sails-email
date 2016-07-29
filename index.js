const Promise = require('bluebird');
const Mailgun = require('mailgun-js');
const createError = require('create-error');
const Handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const InvalidOptions = createError('InvalidOptions');
const fields = ['from', 'to', 'cc', 'bcc', 'subject', 'text', 'html', 'attachment'];

module.exports = function(sails) {
  const templates = {};
  const templateFolder = path.resolve(sails.config.appPath, 'views/emailTemplates');

  // Pre-render all templates on lift
  _.forEach(fs.readdirSync(templateFolder), function(file) {
    if (_.endsWith(file, '.handlebars')) {
      const content = fs.readFileSync(`${templateFolder}/${file}`, 'utf8');
      templates[file.slice(0, -11)] = Handlebars.compile(content);
    }
  });

  // Register helpers
  _.forEach(sails.config.views.helpers, (fn, key) => {
    Handlebars.registerHelper(key, fn);
  });

  return {
      send(passedOptions) {
      const mailgun = Mailgun(_.pick(sails.config.email, ['apiKey', 'domain']));
      const options = _.assign({ data: {} }, sails.config.email, passedOptions);
      const { template, text, html, data, to, from, alwaysSendTo } = options;

      // Make sure we a body, to and from
      if (!template && !text && !html) throw new InvalidOptions('template, text or html is required'); // eslint-disable-line max-len
      if (!from) throw new InvalidOptions('from address is required');
      if (!to) throw new InvalidOptions('to address is required');

      // Convert arrays to comma delimited strings
      if (_.isArray(options.to)) options.to = _.join(options.to, ',');
      if (_.isArray(options.cc)) options.cc = _.join(options.cc, ',');
      if (_.isArray(options.bcc)) options.bcc = _.join(options.bcc, ',');

      // Always send to should override all recipient fields
      if (alwaysSendTo) {
        options.to = alwaysSendTo;
        delete options.cc;
        delete options.bcc;
      }

      // Render the template if we have one
      if (template) options.html = templates[template](options.data);

      return Promise.resolve(mailgun.messages().send(_.pick(options, fields)));
    }
  }
};