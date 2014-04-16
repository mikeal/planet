// Shim the env with the upcoming Promise constructor global.
Promise = require('iou').Promise

// Extends Object.prototype with the 'should' assertion lib.
require('should')

var _ = require('underscore')
  , request = require('request')

  , app = require('../app')

  , TEST_PORT = 3001


exports.startTestServer = function () {

  app.set('port', process.env.PORT || TEST_PORT)

  var promise = new Promise(function (resolve, reject) {
    var server = app.listen(app.get('port'), function () {
      return resolve(server);
    })

    server.on('error', function (err) {
      return reject(err);
    })
  })

  return promise;
}


exports.request = function (method, path, opts) {

  var promise = new Promise(function (resolve, reject) {
    if (path.charAt(0) !== '/') {
      return reject(new Error("URL path given to request() must start with '/'."));
    }

    var url = 'http://localhost:'+ TEST_PORT + path

    _.defaults(opts || {}, {
      method: method
    })

    var req = request(url, opts, function (err, res, body) {
      if (err) return reject(err);

      return resolve({
        headers: res.headers
      , url: res.url
      , method: res.method
      , statusCode: res.statusCode
      , body: body
      });
    })

    req.on('error', function (err) {
      return reject(err);
    })
  })

  return promise;
}


exports.pass = function (func) {
  return function () {
    return func();
  };
}
