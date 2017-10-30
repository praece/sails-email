const Promise = require('bluebird');
const Mailgun = require('mailgun-js');
const createError = require('create-error');
const Handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const InvalidOptions = createError('InvalidOptions');
let mailgun;
const fields = [
  'from',
  'to',
  'cc',
  'bcc',
  'subject',
  'text',
  'html',
  'attachment',
  'inline',
  'h:Cc',
  'h:Reply-To',
  'h:In-Reply-To',
  'h:References',
  'h:Message-Id'
];

module.exports = function(sails) {
  const templates = {};
  const templateFolder = path.resolve(sails.config.appPath, 'views/emailTemplates');
  mailgun = Mailgun(_.pick(sails.config.email, ['apiKey', 'domain']));

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
      const options = _.assign({ data: {} }, sails.config.email, normalizedOptions);
      const { template, text, html, data, to, from, alwaysSendTo, attachment, inline } = options;

      if (sails.config.email.getData) options.data = _.defaults(options.data, sails.config.email.getData());

      // Allow disabling all emails
      if (options.disableSendingEmail) {
        sails.log.warn('Email sending is disabled!');
        return Promise.resolve();
      }

      // Make sure we a body, to and from
      if (!from) throw new InvalidOptions('from address is required');
      if (!to) throw new InvalidOptions('to address is required');

      // Add an empty body if there isn't one
      if (!template && !text && !html) {
        options.html = '<div></div>';
      }

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

      const pickedFields = _.pick(options, fields);

      return Promise.resolve(mailgun.messages().send(pickedFields));
    }
  }
};

function mapAttachments(file) {
  if (file.data) return new mailgun.Attachment(file);
  if (!file.content) return file;
  if (!file.content.headers) return file.content;

  return new mailgun.Attachment({
    data: file.content,
    filename: file.filename,
    knownLength: file.content.headers['content-length'],
    contentType: file.content.headers['content-type']
  });
}
