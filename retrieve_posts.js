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

var getCr     = require('./tumblr-creds')


var client = tumblr.createClient(getCr.getCreds(argv.credentials));

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
