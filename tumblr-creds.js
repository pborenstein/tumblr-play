'use strict';

var _         = require('lodash');
var path      = require('path');
var osHomedir = require('os-homedir');
var fs        = require('fs');
var chalk     = require('chalk');
var JSON5     = require('json5');

exports.getCreds = function(argCreds) {

        // Is there a filename in args?

  var credsFile = argCreds ||

        // no? Use the first file that exists:
        //    * ./tumblr-credentials.json
        //    * ./credentials.json
        //    * ~/tumblr-credentials.json

                  _.find(['tumblr-credentials.json',
                          'credentials.json',
                          path.join(osHomedir(), 'tumblr-credentials.json')
                        ],
                        credsFile => fs.existsSync(credsFile)) ||

        // still no match? Use credentials.json

                  'credentials.json';

        //  read and parse the credsFile

  try {
    var credentials = JSON5.parse(fs.readFileSync(credsFile).toString());
  } catch (e) {
    console.error(chalk.red('Error loading credentials!'));
    console.error('Make sure %s exists or specify %s', chalk.cyan(credsFile || 'credentials.json'), chalk.cyan('--credentials=path/to/credentials.json'));
    process.exit();
  }

  console.log('\nUsing OAuth creds from %s\n', chalk.magenta(path.resolve(credsFile)));

        //  do we have all the properties we need?
        //  1. get the missing keys

  var missingKeys = _.remove([  'consumer_key',
                                'consumer_secret',
                                'token',
                                'token_secret'  ],
                              cred => !credentials.hasOwnProperty(cred))

        // 2. Print the missing keys

  if (!_.isEmpty(missingKeys)) {
    console.warn(chalk.yellow('Credentials is missing keys:'));
    missingKeys.forEach(key => console.warn(chalk.yellow('  * %s'), key));

        // 3. Say how to generate user tokens if possible

    if (credentials.consumer_key && credentials.consumer_secret) {
      console.log('\nYou can generate user tokens by going to the API console:\n')
      console.log(chalk.magenta('https://api.tumblr.com/console/auth' +
                                `?consumer_key=${credentials.consumer_key}` +
                                `&consumer_secret=${credentials.consumer_secret}`));
    }
  }

  return credentials;
}

