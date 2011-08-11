var stream = require('stream')
  , sax = require('sax')
  , util = require('util')
  , rfc822 = require('./rfc822')
  , request = require('request')
  , r = request.defaults({headers:{accept:'application/rss+xml'}})
  ;
  
require('./date')

function FeedStream (strict) {
  var self = this;
  self.writable = true;
  var parser = sax.createStream(strict === undefined ? false : strict);
  self.pipe(parser)

  parser.onopentag = function (node) {
    var name = node.name.toLowerCase()
    // RSS Support
    if (name === 'rss') {
      parser.onopentag = function (node) {
        var name = node.name.toLowerCase()
        if (name === 'channel') {
          var itemlistener = function () {
            var post = {};
            post.enclosures = []
            var url, contenttype;
            parser.onopentag = function (node) {
              var name = node.name.toLowerCase()
              post[name] = ''
              var cdata = false;
              
              parser.onattribute = function (attr) {
                if (attr.name == 'url') url = attr.value
                if (attr.name == 'type') contenttype = attr.value
              }
              
              if (name === 'enclosure') {
                if (url) post.enclosures.push({url:url,contenttype:contenttype})
              }
              
              parser.ontext = function (text) {
                post[name] += text;
              }
              parser.oncdata = function (text) {
                post[name] += text;
                cdata = true
              }
              parser.onclosetag = function (name) {
                name = name.toLowerCase()
                if ((name === 'pubdate' || name === 'lastbuilddate') && typeof post[name] === 'string' ) {
                  // Turn known datetime elements in to Date objects
                  if (Date.parse(post[name])) {
                    post[name] = new Date(Date.parse(post[name]))
                    post.rfc822 = rfc822.getRFC822Date(post[name])
                  } else {
                    // Hack: if we can't parse the date just assume it's proper format
                    post.rfc822 = post[name]
                  }
                  if (cdata) {
                    post[name] = escape(post[name])
                  }
                  url = undefined
                  contenttype = undefined
                }
                
                parser.ontext = null;
                parser.onclosetag = onclosetag
              }
            }
            var onclosetag = function (name) {
              name = name.toLowerCase()
              if (name === 'item') {
                if (!post.guid) {
                  post.guid = post.link
                }
                if (post['content:encoded']) {
                  // If we have an encoded description it's what we really want
                  post.description = post['content:encoded']
                  delete post['content:encoded']
                }
                if (!post.title) {
                  console.error('Feed item does not have title: '+post.link)
                  return
                }
                self.emit('post', post)
                parser.onattribute = null;
                parser.onopentag = function (node) {
                  var name = node.name.toLowerCase()
                  if (name === 'item') itemlistener()
                }
              }
            }
            parser.onclosetag = onclosetag;
          }
          parser.onopentag = function (node) {
            var name = node.name.toLowerCase()
            if (name === 'item') itemlistener();
            else {
              var t = ''
              parser.ontext = function (text) {
                t += text;
              }
              parser.onclosetag = function () {
                if (name === 'pubdate' || name === 'lastbuilddate') {
                  // Turn known datetime elements in to Date objects
                  t = new Date(Date.parse(t));
                }
                self.emit(name, t);
              }
            }
          }
        }
      }
    }
    
    // Atom Support.
    if (name === 'feed') {
      parser.onopentag = function (node) {
        var name = node.name.toLowerCase()
        if (name === 'entry') {
          var post = {}
          
          var link;
          
          parser.onattribute = function (attr) {
            if (attr.name == 'href') link = attr.value
          }
          
          var onentry = function (node) {
            var name = node.name.toLowerCase()
            
            if (name === 'author') {
              // author is a sub element we don't care about
              var counter = 0
              parser.onopentag = function () {
                counter++
              }
              parser.onclosetag = function () {
                if (counter-- === 0) {
                  parser.onopentag = onentry
                  parser.onclosetag = onclose
                  parser.ontext = null
                }
              }
              return
            }
            
            post[name] = ''
            
            parser.ontext = function (text) {
              post[name] += text
            }
            parser.oncdata = function (text) {
              post[name] += text
            }
            parser.onclosetag = function () {
              if (name === 'link') {
                post.guid = link
                post.link = link
              }
                            
              if (name === 'content') {
                post.description = post.content;
                delete post.content
              }
              if (name === 'updated') {
                post.pubdate = new Date(Date.parse(post.updated))
                post.rfc822 = rfc822.getRFC822Date(post.pubdate)
              }
              parser.onopentag = onentry
              parser.onclosetag = onclose
              parser.ontext = null
            }
          }
          var onclose = function () {
            if (Object.keys(post).length) {
              self.emit('post', post)
              post = {}
            }
          }
          
          parser.onopentag = onentry
          parser.onclosetag = onclose
        }
      }
    }
  }
  this.parser = parser
  parser.on('error', function (err) {
    console.error(err)
  })
}
util.inherits(FeedStream, stream.Stream)
FeedStream.prototype.write = function (chunk) {
  this.emit('data', chunk);
}
FeedStream.prototype.end = function (chunk) {
  this.emit('end', chunk)
}

exports.get = function () {
  var s = new FeedStream(arguments[0] ? arguments[0].strict : undefined )
  var req = r.get.apply(request, arguments)
  req.pipe(s)
  req.on('error', function (e) {
    s.emit('error', e)
  })
  return s
}
exports.FeedStream = FeedStream;
exports.createFeedStream = function (strict) {
  return new FeedStream(strict)
}

