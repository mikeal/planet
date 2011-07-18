var stream = require('stream')
  , sax = require('sax')
  , util = require('util')
  , rfc822 = require('./rfc822')
  , request = require('request')
  , r = request.defaults({headers:{accept:'application/rss+xml'}})
  ;

function FeedStream (strict) {
  var self = this;
  self.writable = true;
  var parser = sax.createStream(strict === undefined ? true : strict);
  self.pipe(parser)
  
  parser.onopentag = function (node) {
    if (node.name === 'rss') {
      parser.onopentag = function (node) {
        if (node.name === 'channel') {
          var itemlistener = function () {
            var post = {};
            parser.onopentag = function (node) {
              post[node.name] = ''
              parser.ontext = function (text) {
                post[node.name] += text;
              }
              parser.onclosetag = function () {
                if ((node.name === 'pubDate' || node.name === 'lastBuildDate') && typeof post[node.name] === 'string' ) {
                  // Turn known datetime elements in to Date objects
                  if (Date.parse(post[node.name])) {
                    post[node.name] = Date.parse(post[node.name])
                    post.rfc822 = rfc822.getRFC822Date(post[node.name])
                  } else {
                    // Hack: if we can't parse the date just assume it's proper format
                    post.rfc822 = post[node.name]
                  }
                  
                }
                parser.ontext = null;
                parser.onclosetag = onclosetag
              }
            }
            var onclosetag = function (name) {
              if (name === 'item') {
                self.emit('post', post)
                parser.onopentag = function (node) {
                  if (node.name === 'item') itemlistener()
                }
              }
            }
            parser.onclosetag = onclosetag;
          }
          parser.onopentag = function (node) {
            if (node.name === 'item') itemlistener();
            else {
              var t = ''
              parser.ontext = function (text) {
                t += text;
              }
              parser.onclosetag = function () {
                if (node.name === 'pubDate' || node.name === 'lastBuildDate') {
                  // Turn known datetime elements in to Date objects
                  t = Date.parse(t);
                }
                self.emit(node.name, t);
              }
            }
          }
        }
      }
    }
  }
  this.parser = parser
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
  r.get.apply(request, arguments).pipe(s)
  return s
}
exports.FeedStream = FeedStream;
exports.createFeedStream = function (strict) {
  return new FeedStream(strict)
}

