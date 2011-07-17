var fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , stream = require('stream')
  , util = require('util')
  , http = require('http')
  , rfc822 = require('./rfc822')
  , feedstream = require('./feedstream')
  , handlebars = require('./handlebars')
  , crypto = require('crypto')
  ;
    
// hacky
require('./date')

datejs = fs.readFileSync(path.join(__dirname, 'date.js'))

function abspath (p) {
  if (p[0] !== '/') p = path.join(__dirname, p)
  return p
}

function build (name, blog, builddir, cb) {
  var feed = feedstream.get(blog.feed)
  var counter = 1
  feed.on('post', function (post) {
    if (!post.pubDate) return;
    post.isoTimestamp = post.pubDate.toISOString()
    post._id = post.isoTimestamp + '-' + name 
    post.site = blog
    post.displayDate = post.pubDate.toString("MMM d yyyy")
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
  feed.on('error', function () {
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
  ;
  
var templates = [path.join(__dirname, 'templates', 'index.mustache'), path.join(__dirname, 'templates', 'rss.mustache')];

function createAssets (configpath, cb) {
  readFiles(templates, function (files) {
    var config = getconfig(configpath)
      , indextemplate = files[0][1].toString()
      , rsstemplate = files[1][1].toString()
      ;
  
    fs.readdir(path.join(__dirname, 'build', 'db'), function (err, files) {
      files.sort()
      files.reverse()
      files = files.slice(0, 10).map(function (p) {return path.join(__dirname, 'build', 'db', p)})
      readFiles(files, function (files) {
        config.posts = []
        files.forEach(function (info) {
          config.posts.push(JSON.parse(info[1].toString()))
        })
        config.pubDate = config.posts[0].pubDate;
        config.rfc822 = config.posts[0].rfc822;
        config.sitesArray = []
        for (site in config.sites) {
          config.sites[site].name = site
          config.sitesArray.push(config.sites[site])
        }
        var assets = 
          { index: new HTTPBuffer(handlebars.compile(indextemplate)(config), {'content-type':'text/html'})
          , rss: new HTTPBuffer(handlebars.compile(rsstemplate)(config), {'content-type':'application/rss+xml'})
          , datejs: new HTTPBuffer(datejs, {'content-type':'text/javascript'})
          }
        cb(assets)
      })
    })
  })
}

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
  self.on('pipe', function (source) {
    self.req = source
    assert.ok(self.req.method !== 'PUT' && self.req.method !== 'POST')
  })
}
util.inherits(HTTPBuffer, stream.Stream)
HTTPBuffer.prototype.pipe = function (dest) {
  dest.writeHead(200, this.headers)
  stream.Stream.prototype.pipe.call(this, dest)
  this.emit('data', this.buffer)
  this.emit('end')
}
HTTPBuffer.prototype.write = function () {}
HTTPBuffer.prototype.end = function () {}

function HTTPFile (path, headers) {
  var self = this
  self.writable = true
  self.readable = true
  self.path = path
  self.headers = headers
}

function run (port) {
  var assets;
  setupBuildDir(path.join(__dirname, 'build'))
  createAssets(configpath, function (a) {
    assets = a
    http.createServer(function (req, resp) {
      if (req.url === '/') {
        req.pipe(assets.index)
        assets.index.pipe(resp)
        return
      }
      if (req.url === '/site.rss') {
        req.pipe(assets.rss)
        assets.rss.pipe(resp)
        return
      }
      if (req.url === '/date.js') {
        req.pipe(assets.datejs)
        assets.datejs.pipe(resp)
        return
      }
    })
    .listen(port, function () {
      console.log('http://localhost:'+port)
    })
  })
  
  var interval = function () {
    fullbuild(getconfig(configpath), path.join(__dirname, 'build'),  function () {
      console.log('regenerated from hosts')
      createAssets(configpath, function (a) {
        assets = a
        setTimeout(interval, 1000 * 60 * 10)
      })
    }) 
  }
  setTimeout(interval, 1000 * 60 * 10)
  
  // for debugging
  setInterval(function () {
    createAssets(configpath, function (a) {
      assets = a
    })
  }, 500)
}

exports.run = run;

  



