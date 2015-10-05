//This is for Meteor JS Platform.
Package.describe({
  name: 'nodets:mysql',
  version: '0.0.6',
  // Brief, one-line summary of the package.
  summary: 'This is a mysql wrapper which brings support for mysql collections, in a way that you are expecting!',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/nodets/node-mysql-wrapper',
  documentation: 'README_METEOR.md'
});

Npm.depends({
  'node-mysql-wrapper': "2.5.3"
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use('ecmascript');
  
  api.addFiles('compiled/lib/meteor/MeteorServerSide.js','server');
  api.export(['Mysql']);
});

