var helpers = require('./test_helpers')


describe("with server running", function () {

  before(function (done) {
    helpers.startTestServer()
      .then(helpers.pass(done))
      .catch(done)
  })

  describe("HTTP GET '/' request (HTML)", function () {
    var response = null

    before(function (done) {
      helpers.request('GET', '/')
        .then(function (res) { response = res; return done(); })
        .catch(done)
    })

    it("returns HTTP status 200", function () {
      response.statusCode.should.eql(200)
    })

    it("returns HTML", function () {
      response.headers['content-type'].should.eql('text/html; charset=utf-8')
    })

    it("has a body", function () {
      var contentLength = parseInt(response.headers['content-length'], 10)
        , bodyLength = Buffer.byteLength(response.body)

      contentLength.should.be.above(1000)
      bodyLength.should.eql(contentLength)
    })
  })
})
