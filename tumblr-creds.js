'use strict'

/****
 * tumblr-creds.js
 * 
 * Get credentials for Tumblr REST API
 * from a JSON file that looks like
 * 
 * {
 *      "consumer_key" : "M1oxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
 *   "consumer_secret" : "5coxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
 *             "token" : "Adzxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
 *      "token_secret" : "2T0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 * }
 * 
 * You can use this object to create a Tumblr client:
 * 
 * var getTumblrCredentials = require('./tumblr-creds.js')
 * var client = tumblr.createClient(getTumblrCredentials(optCredsJSONfile));
 * 
 * It looks for the crendtials file in this order:
 *      optCredsJSONfile
 *      './tumblr-credentials.json'
 *      './credentials.json'
 *      '~/'tumblr-credentials.json'
 *      './credentials.json'
 * 
 * If there is no file, process.exit()
 * If the file exists, but is missing info:
 *    say what's missing
 *    give a hint about getting credential values
 * 
 * extracted from https://github.com/pborenstein/tumblr-repl/blob/7a49cc1211328834d1e7df563df9f5a220e3dfce/index.js#L23-L44
 * 
 ****/

var _         = require('lodash')
var path      = require('path')
var osHomedir = require('os-homedir')
var fs        = require('fs')
var chalk     = require('chalk')
var JSON5     = require('json5')

module.exports = function getTumblrCredentials(argCreds) {

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

