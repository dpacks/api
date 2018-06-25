const test = require('ava')
const tutil = require('./util')
const dpackapi = require('../index')

var target
async function stat (t, given, expected) {
  // run test
  try {
    var entry = await dpackapi.stat(target, given)
  } catch (e) {}
  if (expected) {
    t.truthy(entry)
  } else {
    t.falsy(entry)
  }
}

// without preceding slashes
// =

stat.title = (_, given, expected) => `stat(${given}) is ${expected ? 'found' : 'not found'}`
test('create vault', async t => {
  target = await tutil.createVault([
    'foo',
    'subdir/',
    'subdir/bar',
    'baz'
  ])
})

test(stat, 'foo', true)
test(stat, '/foo', true)
test(stat, 'subdir/bar', true)
test(stat, '/subdir/bar', true)
test(stat, 'baz', true)
test(stat, '/baz', true)
test(stat, 'notfound', false)

// with preceding slashes
// =

stat.title = (_, given, expected) => `stat(${given}) is ${expected ? 'found' : 'not found'}`
test('create vault', async t => {
  target = await tutil.createVault([
    '/foo',
    '/subdir/',
    '/subdir/bar',
    '/baz'
  ])
})

test(stat, 'foo', true)
test(stat, '/foo', true)
test(stat, 'subdir/bar', true)
test(stat, '/subdir/bar', true)
test(stat, 'baz', true)
test(stat, '/baz', true)
test(stat, 'notfound', false)

// without preceding slashes w/fs
// =

stat.title = (_, given, expected) => `stat(${given}) is ${expected ? 'found' : 'not found'} (fs)`
test('create vault w/fs', async t => {
  target = await tutil.createFs([
    'foo',
    'subdir/',
    'subdir/bar',
    'baz'
  ])
})

test(stat, 'foo', true)
test(stat, '/foo', true)
test(stat, 'subdir/bar', true)
test(stat, '/subdir/bar', true)
test(stat, 'baz', true)
test(stat, '/baz', true)
test(stat, 'notfound', false)

// with preceding slashes w/fs
// =

stat.title = (_, given, expected) => `stat(${given}) is ${expected ? 'found' : 'not found'} (fs)`
test('create vault w/fs', async t => {
  target = await tutil.createFs([
    '/foo',
    '/subdir/',
    '/subdir/bar',
    '/baz'
  ])
})

test(stat, 'foo', true)
test(stat, '/foo', true)
test(stat, 'subdir/bar', true)
test(stat, '/subdir/bar', true)
test(stat, 'baz', true)
test(stat, '/baz', true)
test(stat, 'notfound', false)
