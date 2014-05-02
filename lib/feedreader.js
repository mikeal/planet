var fs         = require('fs');
var path       = require('path');
var feedparser = require('feedparser');
var request    = require('request');
var config     = require('../config.json');
var mongoose   = require('mongoose');
var date       = require('./date.js');




mongoose.connect('localhost:27017/planet');

fs.readdirSync(__dirname + '/models').forEach(function(filename) {
  if (~filename.indexOf('.js')) {
    require(path.join(__dirname, 'models', filename));
  }
});

var postSchema = mongoose.model('postModel');


function findPost(post){
  var testVal;
  postSchema.findOne({link: post.link}).exec(function (err, foobar){
    if(foobar) {
      testVal = true;
      return true;
    }else{
      return false;
    }
  });
}
function postInIndex(post){
  
  var isIn = findPost(post);
  console.log('is the post in the databse? ' + isIn);
  return isIn;
}

function addPostToIndex(post){

}

function savePost(postToSave){
  postToSave.save(function(err) {
    if (err) {
      throw err;
    }else{
      console.log('Adding the article to the database');
    }
  });
}

function addPosts(post){
  console.log(post.link);
  if (post && post.title && post.description) {
    var postObject = new postSchema({
      title: post.title,
      isoTimestamp: post.pubdate.toISOString(),
      site: post.blog,
      displayDate: post.pubdate.toString('MMM d yyyy'),
      content: post.description,
      link: post.link
    });
    savePost(postObject);
    
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
    var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
    var postObject;
    var post;
    while (post = stream.read()) {
      if (!post.pubdate || !post.pubdate.toISOString) return;
      addPosts(post);


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
 * sets up the project directory
 */
function setupBuildDir(builddir) {
  try {
    fs.mkdirSync(builddir, 0777);
  } catch (e) {

  }

  try {
    fs.mkdirSync(path.join(builddir, 'db'), 0777);
  } catch (e) {

  }
}


/**
 * Run - this starts the app
 * @param  {} port     port variable
 * @param  {} builddir the directory of project
 * @return {}          null
 */

//var assets;
var builddir = require('path').join(__dirname, '../build');
setupBuildDir(builddir);
for (var name in config.sites) {
  console.log(name);
  build(name, config.sites[name], function() {});
}


function run(cb) {
  mongoose
    .model('postModel')
    .find()
    .sort({'displayDate': 'asc'})
    .limit(10) //this should not be run in 'run' method, but instead periodically
    .exec(function(err, posts) {
      cb(posts);
    });   
}


exports.run = run;