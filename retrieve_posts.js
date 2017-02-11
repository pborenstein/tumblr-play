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

// assert(_.isString(process.env.CONSUMER_KEY) && process.env.CONSUMER_KEY.length > 0);
// assert(_.isString(process.env.CONSUMER_SECRET) && process.env.CONSUMER_SECRET.length > 0);
// assert(_.isString(process.env.TOKEN) && process.env.TOKEN.length > 0);
// assert(_.isString(process.env.TOKEN_SECRET) && process.env.TOKEN_SECRET.length > 0);
// assert(_.isString(process.env.BLOG_NAME) && process.env.BLOG_NAME.length > 0);

// Load credentials
var credentials = (function() {
    var credsFile = argv.credentials || _.find([
        'tumblr-credentials.json',
        'credentials.json',
        path.join(osHomedir(), 'tumblr-credentials.json'),
    ], function(credsFile) {
        return fs.existsSync(credsFile);
    }) || 'credentials.json';

    try {
        var credentials = JSON5.parse(fs.readFileSync(credsFile).toString());
    } catch (e) {
        console.error(chalk.red('Error loading credentials!'));
        console.error('Make sure %s exists or specify %s', chalk.cyan(credsFile || 'credentials.json'), chalk.cyan('--credentials=path/to/credentials.json'));
        process.exit();
    }

    // console.log('\nUsing OAuth creds from %s\n', chalk.magenta(path.resolve(credsFile)));

    var missingCredentials = _.remove(['consumer_key', 'consumer_secret', 'token', 'token_secret'], _.partial(_.negate(_.has), credentials));
    if (!_.isEmpty(missingCredentials)) {
        console.warn(chalk.yellow('Credentials is missing keys:'));
        missingCredentials.forEach(function(key) {
            console.warn(chalk.yellow('  * %s'), key);
        });

        if (credentials.consumer_key && credentials.consumer_secret) {
            console.log('\nYou can generate user tokens by going to the API console:\n');
            console.log(chalk.magenta([
                'https://api.tumblr.com/console/auth',
                '?consumer_key=', credentials.consumer_key,
                '&consumer_secret=', credentials.consumer_secret,
            ].join('')));
        }
    }

    return credentials;
})();




var client = tumblr.createClient(credentials);

// quick & dirty it is, life's short, done is better than perfect, I only had 2 hours for the whole project.
// boy, I need to go past this, my eyes are bleeding...
// ... farewell code, hope I will never see you again.

var offset = 0;
var LIMIT = 20;
var arr = [];

//  This gets called when there are no more posts to get
function done(err) {
  console.error('err', err)
  console.log(JSON.stringify(arr));
}



function getPosts(next) {
  function onTumblrData(err, data) {
    console.error('onTumblrData', offset)
    if (err) {
      console.error(err);
      return _.defer(next);
    }

    if (!_.isObject(data) || !_.isArray(data.posts)) {
      console.error('Invalid data received', data);
      return _.defer(next);
    }

    offset += LIMIT;

    if (data.posts.length === 0) {
      // stop there we are done
      return next('done');
    }

    arr.push.apply(arr, data.posts);      // idiom for adding an array to
                                          // an existing array
                                          // Here we're adding `data.posts`
                                          // to `arr`
    next();   // call getPosts again
              // This still feels like magic to me.
              // Like I get it, but I don't know why it works
  }

  client.posts(process.env.BLOG_NAME,
    {
      notes_info: true,
      limit: LIMIT,
      offset: offset
    },
    onTumblrData
  );
}

async.forever(getPosts, done);
