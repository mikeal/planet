var fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , events = require('events')
  , stream = require('stream')
  , util = require('util')
  , http = require('http')
  , url = require('url')
  , rfc822 = require('./rfc822')
  , feedstream = require('./feedstream')
  , handlebars = require('./handlebars')
  , crypto = require('crypto')
  ;
    
require('./date')

function abspath (p) {
  if (p[0] !== '/') p = path.join(__dirname, p)
  return p
}

function build (name, blog, builddir, cb) {
  var feed = feedstream.get(blog.feed)
  var counter = 1
  feed.on('post', function (post) {
    if (!post.pubdate || !post.pubdate.toISOString) return;
    post.isoTimestamp = post.pubdate.toISOString()
    post._id = post.isoTimestamp + '-' + name 
    post.site = blog
    post.displayDate = post.pubdate.toString("MMM d yyyy")
    counter++
    fs.writeFile(path.join(builddir, 'db', post._id + '.json'), JSON.stringify(post, null, 2), function () {
      counter--
      if (counter === 0 && cb) {
        cb()
        cb = null
      }
    })
  })
  feed.on('end', function () {
    counter--
    if (counter === 0 && cb) {
      cb()
      cb = null
    }
  })
  feed.on('error', function (err) {
    console.error('%s - build error (%s) - [%s]: %s', new Date(), blog.feed, err, err.code)
    if (cb) cb();
    cb = null;
  })
}

function setupBuildDir (builddir) {
  try { fs.mkdirSync(builddir, 0777) } catch(e) {}
  try { fs.mkdirSync(path.join(builddir, 'db'), 0777) } catch(e) {}  
}

function fullbuild (config, builddir, cb) {
  if (typeof config === 'string') config = getconfig(config);
  setupBuildDir(builddir)
  var counter = 0;
  for (var name in config.sites) {
    counter++
    build(name, config.sites[name], builddir, function () {
      counter--
      if (counter === 0) cb()
    })
  }
}

function getconfig (p) {
  var config = JSON.parse(fs.readFileSync(abspath(p)).toString());
  if (config.css && (config.css[0] === '.' || config.css[0] === '/')) {
    config.css = fs.readFileSync(
      config.css[0] === '/' ? config.css : path.join(path.dirname(abspath(p)), config.css.slice('./'.length))
    ).toString()
  }
  return config
}

function readFiles (files, cb) {
  var data = {}
    , counter = 0
    , ret = []
    ;
    
  if (files.length === 0) cb([]) 
  files.forEach(function (f) {
    counter++
    fs.readFile(f, function (err, d) {
      data[f] = [err, d]
      counter--
      if (counter === 0) {
        files.forEach(function (f) {
          ret.push(data[f])
        })
        cb(ret)
      }
    })
  })
}

var configpath = 'nodeplanet/config.json'
  , index = null
  , rss = null
  , opml = null
  ;
  
var templates = [path.join(__dirname, 'templates', 'index.mustache'), path.join(__dirname, 'templates', 'rss.mustache'), path.join(__dirname, 'templates', 'opml.mustache')];

function createAssets (configpath, builddir, assets, cb) {
  readFiles(templates, function (files) {
    var config = getconfig(configpath)
      , indextemplate = files[0][1].toString()
      , rsstemplate = files[1][1].toString()
      , opmltemplate = files[2][1].toString()
      ;
  
    fs.readdir(path.join(builddir, 'db'), function (err, files) {
  	  if(err) throw err;
  	  
      files.sort()
      files.reverse()
      files = files.slice(0, 10).map(function (p) {return path.join(builddir, 'db', p)})
      readFiles(files, function (files) {
        config.posts = []
        files.forEach(function (info) {
          try {
            config.posts.push(JSON.parse(info[1].toString()))
          } catch(e) {
            console.error('Couldnt parse')
          }
        })
        config.posts.forEach(function (post) {
          if (post.site.link) {
            post.link = url.resolve(post.site.link, post.link)
          }
        })
        
        if (config.posts.length) {
          config.pubdate = config.posts[0].pubdate;
          config.rfc822 = config.posts[0].rfc822;
        }
        config.sitesArray = []
        for (site in config.sites) {
          config.sites[site].name = site
          config.sitesArray.push(config.sites[site])
        }
        
        var newassets = 
          { index: new HTTPBuffer(handlebars.compile(indextemplate)(config), {'content-type':'text/html'})
          , rss: new HTTPBuffer(handlebars.compile(rsstemplate)(config), {'content-type':'application/rss+xml'})
          , opml: new HTTPBuffer(handlebars.compile(opmltemplate)(config), {'content-type':'text/x-opml'})
          }
        
        // See if they have changed, if they have then use the old ones with the older cache datetime
        if (assets) {
          if (assets.index.buffer === newassets.index.buffer) {
            newassets.index = assets.index;
          }
          if (assets.rss.buffer === newassets.rss.buffer) {
            newassets.rss = assets.rss;
          }
          if (assets.opml.buffer === newassets.opml.buffer) {
            newassets.opml = assets.opml;
          }
        }
        cb(newassets)
      })
    })
  })
}

function clone (self) {
  var newObj = (self instanceof Array) ? [] : {};
  for (i in self) {
    if (i == 'clone') continue;
    if (self[i] && typeof self[i] == "object") {
      newObj[i] = self[i].clone();
    } else newObj[i] = self[i]
  } return newObj;
};

function HTTPBuffer (buffer, headers) {
  var self = this
  if (!Buffer.isBuffer(buffer)) buffer = new Buffer(buffer)
  self.writable = true
  self.readable = true
  self.buffer = buffer
  
  self.md5 = crypto.createHash('md5').update(self.buffer).digest("hex");
  
  self.created = new Date()
  self.headers = headers
  self.headers['content-length'] = buffer.length
  self.headers['last-modified'] = rfc822.getRFC822Date(self.created)
  self.headers['etag'] = self.md5
  self.on('request', function (req, resp) {
    if (req.method === 'PUT' || req.method === 'POST') {
      resp.writeHead(405)
      resp.end()
      return
    }
    var headers = clone(self.headers)
    // It's safer to just do direct timestamp matching because javascript comparison and Date objects
    // are all kinds of screwed up.
    if (req.headers['if-modified-since'] && req.headers['if-modified-since'] === self.headers['last-modified']) {
      headers['content-length'] = 0
      resp.writeHead(304, headers)
      resp.end()
      return
    }

    if (req.headers['if-none-match'] && req.headers['if-none-match'] === self.headers['etag']) {
      headers['content-length'] = 0
      resp.writeHead(304, headers)
      resp.end()
      return
    }
    
    resp.writeHead(200, headers);
    if (!req.method !== 'HEAD') {
      resp.write(self.buffer)
    }
    resp.end()
  })
}
util.inherits(HTTPBuffer, events.EventEmitter)

function run (port, builddir) {
  var assets;
  setupBuildDir(builddir)
  createAssets(configpath, builddir, assets, function (a) {
    assets = a
    http.createServer(function (req, resp) {
      if (req.url === '/') {
        return assets.index.emit('request', req, resp)
      }
      if (req.url === '/site.rss') {
        return assets.rss.emit('request', req, resp)
      }
      if (req.url === '/site.opml') {
        return assets.opml.emit('request', req, resp)
      }
      resp.statusCode = 404
      resp.end()
    })
    .listen(port, function () {
      console.log('http://localhost:'+port)
    })
  })
  
  var interval = function () {
    var timedout = false
    var t = setTimeout(function () {
      console.error('timed out, generating anyway')
      createAssets(configpath, builddir, assets, function (a) {
        assets = a
        setTimeout(interval, 1000 * 60 * 10)
      })
    }, 1000 * 30)
    
    fullbuild(getconfig(configpath), builddir,  function () {
      if (timedout) return
      console.log('regenerated from hosts')
      clearTimeout(t)
      createAssets(configpath, builddir, assets, function (a) {
        assets = a
        setTimeout(interval, 1000 * 60 * 10)
      })
    }) 
  }
  setTimeout(interval, 1000 * 10)
  
  // for debugging
  // setInterval(function () {
  //   createAssets(configpath, builddir, function (a) {
  //     assets = a
  //   })
  // }, 500)
}

exports.run = run;

  



