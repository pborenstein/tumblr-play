'use strict';

// Usage:
// node analyze_likers_websites.js >> likers_websites.txt
var posts = require('./posts.json');
var _ = require('lodash');


//  `summary` is a hash of all blogname/count pairs
//            we create the key (blogname) if it doesn't exist
//  given a note, pluck its name and count it
function countBlog(summary, note) {
  summary[note.blog_name] = (summary[note.blog_name] || 0) + 1;
  return summary;
}

//  given a post, find its notes, and
//  take a census of all the blogs that liked the post 
//  `summary` is a hash of all blogname/count pairs
function countNotes(summary, post) {
  return (post.notes || []).reduce(countBlog, summary);
}

var x1= _.chain(posts)
var x2= x1.reduce(countNotes, {})
var x3= x2.toPairs()

console.log(
   _.chain(posts)               // For every post
    .reduce(countNotes, {})     // Count the number of likes per blog
    .toPairs()                  // Convert { blog1: 23, tum2: 7, ...}
                                // to [ ['blog1', 23], ['tum2', 7], ...]
    .sortBy(1)                  // Sort lo to hi by count ( item[1] )
    .reverse()                  // uh, hi to lo pls
    .value()                    // unwrap the lodash wrapper
                                // and use regular javascript methods
    .map( (line) => line.reverse().join(': ') )   // flip name,count & turn it into a string
    .join('\n'))                // Join all the strings into one 
