var arg = process.argv.pop()

var assert = require('assert')

if (arg === 'all') {
  var config = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'nodeplanet/config.json')).toString());
  for (i in config.sites) {
    test(config.sites[i].feed)
  }
} else {
  test(arg)
}

function test (url) {
  require('./feedstream').get(url).on('post', function (post) {
    // console.error(post)
    assert.ok(post.link)
    assert.ok(post.guid)
    assert.ok(post.rfc822)
    assert.ok(post.title)
    assert.ok(post.description)
    console.log('passed')
  })
}

