var arg = process.argv.pop()

var assert = require('assert')

require('./feedstream').get(arg).on('post', function (post) {
  // console.error(post)
  assert.ok(post.link)
  assert.ok(post.guid)
  assert.ok(post.rfc822)
  assert.ok(post.title)
  assert.ok(post.description)
  console.log('passed')
})