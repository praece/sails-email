const Handlebars = require('handlebars');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const templates = {};

const templateFolder = path.resolve(sails.config.appPath, 'views/templates');

// Pre-render all templates on lift
_.forEach(fs.readdirSync(templateFolder), file => {
  if (_.endsWith(file, '.handlebars')) {
    const content = fs.readFileSync(`${templateFolder}/${file}`, 'utf8');
    templates[file.slice(0, -11)] = Handlebars.compile(content);
  }
});

sails.after('ready', () => {
  // Register helpers
  _.forEach(sails.config.views.helpers, (fn, key) => {
    Handlebars.registerHelper(key, fn);
  });
});

module.exports = templates;
