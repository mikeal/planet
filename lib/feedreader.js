var fs = require('fs');
var path = require('path');
var stream = require('stream');
var url = require('url');
var rfc822 = require('./rfc822.js');
var feedparser = require('feedparser');
var request = require('request');
var config = require('../config.json');
var mongoose = require('mongoose');



fs.readdirSync(__dirname + '/models').forEach(function(filename){
  if(~filename.indexOf('.js')){
    require(path.join(__dirname, 'models', filename));
  }
});
var postSchema = require('mongoose').model('postModel');

require('./date.js');




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
    var meta = this.meta;// **NOTE** the "meta" is always available in the context of the feedparser instance
    var postObject;
    var post;
    var postExists = false;


    while (post = stream.read() && postExists!==true) {

      if (!post.pubdate || !post.pubdate.toISOString) return; 

        try{
          if (post.title !== null || post.description !== ''){
            postObject = new postSchema({
              title: post.title,
              isoTimestamp: post.pubdate.toISOString(),
              site: post.blog,
              displayDate: post.pubdate.toString("MMM d yyyy"),
              content: post.description
            });
            
            
            postObject.save(function(err){
              if(err){
                throw err;
              } 
            });
          }
          else{
            console.log('The article did not have enough information to be able to add to database');
          }
        }catch(e){
          console.log('could not parse article - we ran into an error');
        }       
      counter++;
    }
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

function fullbuild(builddir, cb) {
  setupBuildDir(builddir);
  var counter = 0;
  for (var name in config.sites) {
    counter++;
    build(name, config.sites[name], function() {
      counter--;
      if (counter === 0) cb();
    });
  }
}



function createAssets(builddir, assets, collection, cb) {

  collection.find({}, {}, function(err, docs){ //retreives all files from collection
    var data = config;


    if (err){ 
      throw err;
    }

    var data = config;
    var files = docs;

    //console.log(files);




    // files = files.slice(0, 10).map(function(p) {
    //   return path.join(builddir, 'db', p);
    // });
    // readFiles(files, function(files) {
    //   data.posts = [];
    //   files.forEach(function(info) {
    //     try {
    //       data.posts.push(JSON.parse(info[1].toString()));
    //     } catch (e) {
    //       console.error('Couldnt parse');
    //     }
    //   });
    //   data.posts.forEach(function(post) {
    //     if (post.site.link) {
    //       post.link = url.resolve(post.site.link, post.link);
    //     }
    //   });

    //   if (data.posts.length) {
    //     data.pubdate = data.posts[0].pubdate;
    //     data.rfc822 = data.posts[0].rfc822;
    //   }
    //   data.sitesArray = [];
    //   for (var site in data.sites) {
    //     data.sites[site].name = site;
    //     data.sitesArray.push(data.sites[site]);
    //   }

    //   cb(data);
    // });
  });

  
}



/**
 * Run - this starts the app
 * @param  {} port     port variable
 * @param  {} builddir the directory of project
 * @return {}          null
 */

var assets;
var builddir = require('path').join(__dirname, '../build');
setupBuildDir(builddir);
for (var name in config.sites) {
  build(name, config.sites[name], function() {});
    
}
var articles = mongoose.model('postModel').find().sort({'displayDate': 'asc'}).limit(10);
var heyHey;

articles.exec(function(err, posts) {
  heyHey = posts;
  console.log('here are the posts');
  //console.log(heyHey);

});

function run(cb) {
  cb(heyHey);
}

var interval = function() {
  var timedout = false;
  var t = setTimeout(function() {
    console.error('timed out, generating anyway');
    createAssets(builddir, assets, function(a) {
      assets = a;
      setTimeout(interval, 1000 * 60 * 10);
    });
  }, 1000 * 30);

  fullbuild(builddir, function() {

    if (timedout) {
      return console.log('regenerated from hosts');
    }
    clearTimeout(t);
    createAssets(builddir, assets, function(a) {
      assets = a;
      setTimeout(interval, 1000 * 60 * 10);
    });
  });
};

//setTimeout(interval, 1000 * 10);

exports.run = run;