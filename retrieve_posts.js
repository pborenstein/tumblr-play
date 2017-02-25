'use strict';
var async     = require('async');
var _         = require('lodash');
var tumblr    = require('tumblr.js');
var assert    = require('better-assert');
var chalk     = require('chalk');
var argv      = require('minimist')(process.argv.slice(2));
var path      = require('path');
var osHomedir = require('os-homedir');
var fs        = require('fs');
var JSON5     = require('json5');

// Load credentials
function getCredentials(argCreds) {

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


var client = tumblr.createClient(getCredentials(argv.credentials));

        //  I seriously don't like this global
        //  it is used in
        //  * done()
        //  * onTumblrData()
        //  can we replace it with some sort of accumualtor?

var allThePosts = [];

        //  Same here. We're using options
        //  globally and saving state
        //  for the offset. Sad!

var options = {
  notes_info: true,
  limit: 20,
  offset: 0
}


//  This gets called when there are no more posts to get
function done(err) {
  console.log(JSON.stringify(allThePosts));
}


function getPosts(next) {

  client.posts(process.env.BLOG_NAME, options, onTumblrData);

  function onTumblrData(err, data) {
    if (err) {
      console.error(err);
      return _.defer(next);
    }

    if (!_.isObject(data) || !_.isArray(data.posts)) {
      console.error('Invalid data received', data);
      return _.defer(next);
    }

    options.offset += options.limit;

    if (data.posts.length === 0) {

          //  Calling next() with one non-null argument
          //  tells async.forever()
          //  to call done()
      return next('finished');
    }

          //  idiom for concatinating arrays
          //  here were adding this batch of data.posts
          //  to allThePosts

    allThePosts.push.apply(allThePosts, data.posts);

    console.error('allThePosts.length', allThePosts.length)

          //  Calling next() with no arguments
          //  tells async.forever()
          //  to call getPosts() again

    next();
  }
}

async.forever(getPosts, done);
