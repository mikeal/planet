var fs = require('fs');
var path = require('path');
var stream = require('stream');
var url = require('url');
var rfc822 = require('./rfc822.js');
var feedparser = require('feedparser');
var request    = require('request');
var config = require('../config.json');


require('./date.js');

function abspath (p) {
  if (p[0] !== '/'){
    p = path.join(__dirname, p);
    return p;
  }
}

function build (name, blog, builddir, cb) {
  var counter = 1;

  var req = request(blog.feed);
  var parser = new feedparser();

  req.on('error', function (error) {
    // handle any request errors
  });
  req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200){
      return this.emit('error', new Error('Bad status code'));
    }

    stream.pipe(parser);
  });

  parser.on('readable', function() {
    // This is where the action is!
    var stream = this;
    var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
    var item;

    while (post == stream.read()) {
      if (!post.pubdate || !post.pubdate.toISOString) return;

      post.isoTimestamp = post.pubdate.toISOString();
      post._id = post.isoTimestamp + '-' + name;
      post.site = blog;
      post.displayDate = post.pubdate.toString("MMM d yyyy");
      counter++;
      fs.writeFile(path.join(builddir, 'db', post._id + '.json'), JSON.stringify(post, null, 2), function () {
        counter--;
        if (counter === 0 && cb) {
          cb();
          cb = null;
        }
      });
    }
  });

  parser.on('end', function () {
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
function setupBuildDir (builddir) {
  try {
    fs.mkdirSync(builddir, 0777);
  } catch(e) {

  }
  try {
    fs.mkdirSync(path.join(builddir, 'db'), 0777);
  } catch(e) {

  }
}

function fullbuild (builddir, cb) {
  setupBuildDir(builddir);
  var counter = 0;
  for (var name in config.sites) {
    counter++;
    build(name, config.sites[name], builddir, function () {
      counter--;
      if (counter === 0) cb();
    });
  }
}

/**
 * Is called from creatAssets
 * @param  {[type]}   files [description]
 * @param  {Function} cb    [description]
 * @return {[type]}         [description]
 */
function readFiles (files, cb) {
  var data = {};
  var counter = 0;
  var ret = [];

  if (files.length === 0) cb([]);
  files.forEach(function (f) {
    counter++;
    fs.readFile(f, function (err, d) {
      data[f] = [err, d];
      counter--;
      if (counter === 0) {
        files.forEach(function (f) {
          ret.push(data[f]);
        });
        cb(ret);
      }
    });
  });
}

function createAssets(builddir, assets, cb) {

  fs.readdir(path.join(builddir, 'db'), function (err, files) {
    if(err) throw err;

    var data = config;

    files.sort();
    files.reverse();
    files = files.slice(0, 10).map(function (p) {
      return path.join(builddir, 'db', p);
    });
    readFiles(files, function (files) {
      data.posts = [];
      files.forEach(function (info) {
        try {
          data.posts.push(JSON.parse(info[1].toString()));
        } catch(e) {
          console.error('Couldnt parse');
        }
      });
      data.posts.forEach(function (post) {
        if (post.site.link) {
          post.link = url.resolve(post.site.link, post.link);
        }
      });

      if (data.posts.length) {
        data.pubdate = data.posts[0].pubdate;
        data.rfc822  = data.posts[0].rfc822;
      }
      data.sitesArray = [];
      for (var site in data.sites) {
        data.sites[site].name = site;
        data.sitesArray.push(data.sites[site]);
      }

      cb(data);
    });
  });
}

function clone(self) {
  var newObj = (self instanceof Array) ? [] : {};
  for (var i in self) {
    if (i == 'clone'){
      continue;
    }
    if (self[i] && typeof self[i] == "object") {
      newObj[i] = self[i].clone();
    }else {
      newObj[i] = self[i];
    }
  }
  return newObj;
}

/**
 * Run - this starts the app
 * @param  {} port     port variable
 * @param  {} builddir the directory of project
 * @return {}          null
 */

var assets;
var builddir = require('path').join(__dirname, '../build');

function run(cb) {
  setupBuildDir(builddir);
  createAssets(builddir, assets, function (a) {
    assets = a;
    cb(assets);
  });
}

var interval = function () {
  var timedout = false;
  var t = setTimeout(function () {
    console.error('timed out, generating anyway');
    createAssets(builddir, assets, function (a) {
      assets = a;
      setTimeout(interval, 1000 * 60 * 10);
    });
  }, 1000 * 30);

  fullbuild(builddir,  function () {
    if (timedout){
      return console.log('regenerated from hosts');
    }
    clearTimeout(t);
    createAssets(builddir, assets, function (a) {
      assets = a;
      setTimeout(interval, 1000 * 60 * 10);
    });
  });
};
setTimeout(interval, 1000 * 10);

exports.run = run;