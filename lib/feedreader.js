/*
TODO - make sure that the article is not empty
 */

var fs = require('fs');
var path = require('path');
var feedparser = require('feedparser');
var request = require('request');
var config = require('../config.json');
var mongoose = require('mongoose');



mongoose.connect('localhost:27017/planet');

fs.readdirSync(__dirname + '/models').forEach(function(filename) {
  if (~filename.indexOf('.js')) {
    require(path.join(__dirname, 'models', filename));
  }
});

var postSchema = mongoose.model('postModel');

function findPost(post, callback) {
  var testVal;
  postSchema.findOne({
    link: post.link
  }).exec(function(err, foobar) {
    if (foobar) {
      console.log('Already exists ' + foobar.title );
      testVal = true;
      return true;
      callback();
    } else {
      return false;
      callback()
    }
  });
}

function savePost(postToSave) {
  var testVar = findPost(postToSave, function() {
    console.log('is the post already there? - ' + testVar);
    if (!testVar) {
      postToSave.save({
        upsert: true
      }, function(err) {
        if (err) {
          console.log(error);
        } else {
          console.log('Adding the post: ' + postToSave.title);
        }
      });
    }else{
      console.log('did not add article');
    }
  });
    
}

function parsePost(post) {
  //console.log(post);
  if (post && post.title !== '' && post.title !== 'No title' && post.content !== '') {
    var postObject = new postSchema({
      title: post.title,
      isoTimestamp: post.pubdate,
      site: post.blog,
      displayDate: post.pubdate.toString('MMM d yyyy'),
      content: post.description,
      link: post.link,
      author: post.author
    });
    savePost(postObject);

  }else{
    console.log('Not enough info to add post to database - aka: blank title, blank content, etc.');
  }
}


function build(name, blog, cb) {
  var counter = 1;

  var req = request(blog.feed);
  var parser = new feedparser();

  req.on('error', function(error) {
    // handle any request errors
    console.log(error);
  });
  req.on('response', function(res) {
    var stream = this;

    if (res.statusCode !== 200) {
      return this.emit('error', new Error('Bad status code'));
    }

    stream.pipe(parser);
  });
  parser.on('readable', function() {
    // This is where the action is!

    var stream = this;
    var post;
    while (post = stream.read()) {
      if (!post.pubdate || !post.pubdate.toISOString) return;
      parsePost(post);


    }

    counter++;
  });

  parser.on('end', function() {
    counter--;
    if (counter === 0 && cb) {
      cb();
      cb = null;
    }
  });

  parser.on('error', function(err) {
    console.error('%s - build error (%s) - [%s]: %s', new Date(), blog.feed, err, err.code);
    if (cb) cb();
    cb = null;
  });
}
/**
 * Run - this starts the app
 * @param  {} port     port variable
 * @param  {} builddir the directory of project
 * @return {}          null
 */

function setup() {
  console.log('~~~~~~~~~~~~~~~~~~~~Here are the current sites~~~~~~~~~~~~~~~~~~~~~~~~~~');
  for (var name in config.sites) {

    console.log(name);

    build(name, config.sites[name], function() {});
  }
  console.log('~~~~~~~~~~~~~~~~~~~~Done displaying the current sites~~~~~~~~~~~~~~~~~~~~~~~~~');
  //preiodicBuild();
}


var minutes = 2;
var theInterval = minutes * 60 * 1000;
setInterval(function() {
  console.log('This is the periodic rss update');
  setup();
}, theInterval);


setup();

function run(cb) {
  mongoose
    .model('postModel')
    .find()
    .sort({
      'displayDate': 'desc'
    })
    .limit(10)
  .exec(function(err, posts) {
    cb(posts);
  });
}


exports.run = run;