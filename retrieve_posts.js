'use strict';
// https://github.com/subnomo/tumblr-like-dl/blob/master/index.js
var _         = require('lodash');
var tumblr    = require('tumblr.js');
var argv      = require('minimist')(process.argv.slice(2));

var usePromises = true

var credentials = require('./tumblr-creds')(argv.credentials)
var client = tumblr.createClient({
                                    credentials,
                                    usePromises: usePromises
                                 });

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

  client.blogPosts(process.env.BLOG_NAME, options, onTumblrData);

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
          //  tells myForever()
          //  to call done()
      return next('finished');
    }

          //  idiom for concatinating arrays
          //  here were adding this batch of data.posts
          //  to allThePosts

    allThePosts.push.apply(allThePosts, data.posts);

    console.error('allThePosts.length', allThePosts.length)

          //  Calling next() with no arguments
          //  tells myForever()
          //  to call getPosts() again

    next();
  }
}

        //  We're using our own version of async.forever()
        //  (from async@0.9.2 https://github.com/caolan/async/blob/baee7a647e77195ee897caf1e17374eae473e517/lib/async.js#L1095-L1106)
        //  so we can see what's going on instead of letting
        //  a black box handle it.

var myForever  = function (fn, callback) {
  function next(err) {
    if (err) {
      if (callback) {
        return callback(err);
      }
      throw err;
    }
    fn(next);
  }
  next();
};


function handlePromise(data) {
  if (data.posts.length != 0) {
    allThePosts.push.apply(allThePosts, data.posts);
  }
}


if (usePromises) {
  client.returnPromises()
  var aPromise = client.blogPosts(process.env.BLOG_NAME, options)
                       .then(handlePromise)
                       .then(x => console.log(JSON.stringify(allThePosts)))



} else {
  myForever(getPosts, done);
}

