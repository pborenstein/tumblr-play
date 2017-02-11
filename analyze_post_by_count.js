'use strict';

// Usage:
// node analyze.js >> post_by_count.csv
var posts = require('./posts.json');
var _ = require('lodash');
var moment = require('moment');

function getPostTimestamp(posts) {
  return post.timestamp
}

//  For the given post,
//  Return a string of the form;
//  66;http://thedailytask.tumblr.com/post/109879218750/150202;2015-02-02

//  from three-element array:
//    [note_count, post_url, date]
//  
//  join this into a semicolon-separated string

function getCountDate (post) {
  return [post.note_count,
          post.post_url,
          moment(post.timestamp * 1000).format('YYYY-MM-DD')
         ]
         .join(';');
}

console.log(
  _.chain(posts)              // for every post
   .sortBy(getPostTimestamp)  // sorted by post timestamp
   .value()                   // turn it into an array
   .reverse()                 // reverse it
   .map(getCountDate)         // collect the count/date
   .join('\n'));              // Join each line with a newline
