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

//     var missingCredentials = 
//           _.remove(['consumer_key', 'consumer_secret', 'token', 'token_secret'],
//                     _.partial(_.negate(_.has), credentials));
// 
// could do
//    ['consumer_key', 'consdumer_secret', 'token', 'token_secret']
//      .reduce(function(acc,x){return acc && credentials.hasOwnProperty(x)}, true)
// but that won't tell you what's missing
//
// but see: https://www.sitepoint.com/lodash-features-replace-es6/#5partial
//  var sayHelloTo = _.partial(greet, 'hello');
//  const sayHelloTo = name => greet('hello', name);
//
// so we can replace:
//    _.partial(_.negate(_.has), credentials)
// with this:
//    cred => !credentials.hasOwnProperty(cred)
//
//  So the missing credentials:
//    _.remove(['consumer_key', 'consumer_secret', 'token', 'token_secret'],
//                   cred => !credentials.hasOwnProperty(cred))
//
//    Remove from the list any element
//      that is not a property of the credentials object
//      return the removed elements
//    Which is really kind of a counterintuitive way of doing this.
//    what you want to say is 
//      here' a list of keys
//      tell me which ones aren't in the credential object
//      This says --- ugh it makes my brain hurt

    var missingCredentials = 
          _.remove(['consumer_key', 'consumer_secret', 'token', 'token_secret'],
                   cred => !credentials.hasOwnProperty(cred))

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

var arr = [];
var options = {
  notes_info: true,
  limit: 20,
  offset: 0
}


//  This gets called when there are no more posts to get
function done(err) {
  console.log(JSON.stringify(arr));
}


function getPosts(next) {

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

  client.posts(process.env.BLOG_NAME, options, onTumblrData);
}

async.forever(getPosts, done);
