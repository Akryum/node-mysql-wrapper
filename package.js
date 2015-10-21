//This is for Meteor JS Platform.
Package.describe({
  name: 'nodets:mysql',
  version: '2.7.3',
  // Brief, one-line summary of the package.
  summary: 'This is a meteor package which brings real and easy support to Mongo.Collection for Mysql databases.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/nodets/node-mysql-wrapper',
  documentation: 'README_METEOR.md'
});

Npm.depends({
  'node-mysql-wrapper': "2.7.3"
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use('ecmascript');
  
  api.addFiles('compiled/lib/meteor/MeteorServerSide.js','server');
  api.export(['Mysql']);
});

