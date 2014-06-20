var fs           = require('fs');
var path         = require('path');
var feedparser   = require('feedparser');
var request      = require('request');
var config       = require('../config.json');
var mongoose     = require('mongoose');
var colors       = require('colors');
var mongoosastic = require('mongoosastic');
require('./models/post.js');


var mongooseUrl = process.env.MONGOHQ_URL || 'mongodb://127.0.0.1/planet';
mongoose.connect(mongooseUrl);


var postSchema = mongoose.model('postModel');



function findPost(post, callback){
  var testVal;
  postSchema.findOne({link: post.link}).exec(function (err, foobar){
    if(foobar) {
      process.stdout.write('Already found the article: ' + foobar.title);
      testVal = true;
      callback(testVal);
    }else{
      testVal = false;
      callback(testVal);
    }
  });
}

function savePost(postToSave) {
  findPost(postToSave, function(testVar) {
    if (!testVar) {
      postToSave.save(function (err, product, numberAffected) {
        if (err) {
          console.log(err);
        } else {
          console.log(('Adding the post: '.red + postToSave.title));
        }
      });
    }else{
      console.log(' - not adding'.yellow);
    }
  });

}

function parsePost(post) {

  if (post && post.title != '' && post.title != 'No title') {
    var postObject = new postSchema({
      title: post.title,
      isoTimestamp: post.pubdate,
      site: post.blog,
      displayDate: post.pubdate.toString('MM dd yyyy'),
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

/*
Functions called from index.js
 */

function run(cb) {
  mongoose
    .model('postModel')
    .find()
    .sort({'displayDate': 'desc'})
    .limit(10)
    .exec(function(err, posts) {
      cb(posts);
    });
}

function getArticlesWithPageNum(pageNum, cb){
  var perPage = 10;
  var page = pageNum > 0 ? pageNum : 0;
  if(pageNum === 'forward'){
    mongoose
    .model('postModel')
    .find()
    .sort({'displayDate': 'desc'})
    .limit(10)
    .exec(function(err, posts) {
      cb(posts);
    });
  }
  else if(pageNum === 'back'){
    // TODO find total number of documents and divide by perpage and get num to whole num
  }
  else{
    mongoose
      .model('postModel')
      .find()
      .sort({'displayDate': 'desc'})
      .limit(perPage)
      .skip(perPage * (page-1))
      .exec(function(err, posts) {
        cb(posts);
      });
  }
}

function getArticleById(id, cb){
  postSchema
    .findById(id, function (err, doc) {
      console.log('Found the article user was requesting');
      cb(doc);
    });
}

function getArticlesBySearchString(searchString, cb){

  postSchema.search({query: searchString}, function(err, results) {
    if (err) throw err;
    for (hit in results.hits.hits){
      console.log(results.hits.hits[hit]._score + " - " + results.hits.hits[hit]._source.title);
    }

    cb(results);
  });
}
/*
End of Functions called from index.js
 */



function setup(){
  console.log('~~~~~~~~~~~~~~~~~~~~List of sites that are being used~~~~~~~~~~~~~~~~~~~~~~~~~~'.blue);

  for (var name in config.sites) {




    console.log((name + ' : ' + config.sites[name].link).blue);
    console.log('');

    build(name, config.sites[name], function() {});

  }


  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~Done displaying sites~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'.blue);
}

setup();

var minutes = 30;
var theInterval = minutes * 60 * 1000;
setInterval(function() {
  console.log("This is the periodic update");
  setup();
}, theInterval);



exports.run                       = run;
exports.getArticlesWithPageNum    = getArticlesWithPageNum;
exports.getArticleById            = getArticleById;
exports.getArticlesBySearchString = getArticlesBySearchString;