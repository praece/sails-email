const Promise = require('bluebird');
const Mailgun = require('mailgun-js');
const createError = require('create-error');
const Handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const InvalidOptions = createError('InvalidOptions');
const fields = ['from', 'to', 'cc', 'bcc', 'subject', 'text', 'html', 'attachment', 'inline'];

module.exports = function(sails) {
  const templates = {};
  const templateFolder = path.resolve(sails.config.appPath, 'views/emailTemplates');

  // Pre-render all templates on lift
  _.forEach(fs.readdirSync(templateFolder), file => {
    if (_.endsWith(file, '.handlebars')) {
      const content = fs.readFileSync(`${templateFolder}/${file}`, 'utf8');
      templates[file.slice(0, -11)] = Handlebars.compile(content);
    }
  });

  return {
    normalizeOptions() {
      const args = _.toArray(arguments);

      if (args.length === 1) return args[0];

      return _.assign({}, args[2], { data: args[1] }, { template: args[0] });
    },

    send() {
      const normalizedOptions = this.normalizeOptions.apply(this, arguments);
      const mailgun = Mailgun(_.pick(sails.config.email, ['apiKey', 'domain']));
      const options = _.assign({ data: {} }, sails.config.email, normalizedOptions);
      const { template, text, html, data, to, from, alwaysSendTo, attachment, inline } = options;

      // Make sure we a body, to and from
      if (!template && !text && !html) throw new InvalidOptions('template, text or html is required'); // eslint-disable-line max-len
      if (!from) throw new InvalidOptions('from address is required');
      if (!to) throw new InvalidOptions('to address is required');

      // Convert arrays to comma delimited strings or attachments
      if (_.isArray(options.to)) options.to = _.join(options.to, ',');
      if (_.isArray(options.cc)) options.cc = _.join(options.cc, ',');
      if (_.isArray(options.bcc)) options.bcc = _.join(options.bcc, ',');
      if (!_.isArray(attachment)) options.attachment = [attachment];
      if (!_.isArray(inline)) options.inline = [inline];

      // Map streams with known lengths
      if (attachment) options.attachment = _.map(options.attachment, mapAttachments);
      if (inline) options.inline = _.map(options.inline, mapAttachments);

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

function mapAttachments(file) {
  if (!file.content) return file;
  if (!file.content.headers) return file.content;

  return new mailgun.Attachment({
    data: file.content,
    filename: file.filename,
    knownLength: file.content.headers['content-length'],
    contentType: file.content.headers['content-type']
  });
}
