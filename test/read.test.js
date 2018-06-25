const test = require('ava')
const {NotFoundError, NotAFileError} = require('@dbrowser/errors')
const tutil = require('./util')
const dpackapi = require('../index')

var target
async function readTest (t, path, expected, errorTests) {
  try {
    var data = await dpackapi.readFile(target, path, Buffer.isBuffer(expected) ? 'binary' : 'utf8')
    t.deepEqual(data, expected)
  } catch (e) {
    if (errorTests) errorTests(t, e)
    else throw e
  }
}

readTest.title = (_, path) => `readFile(${path}) test`
test('create vault', async t => {
  target = await tutil.createVault([
    'foo',
    'foo2/',
    'foo2/bar',
    { name: 'baz', content: Buffer.from([0x00, 0x01, 0x02, 0x03]) },
    'dir/'
  ])
})

test(readTest, 'foo', 'content')
test(readTest, '/foo', 'content')
test(readTest, 'foo2/bar', 'content')
test(readTest, '/foo2/bar', 'content')
test(readTest, 'baz', Buffer.from([0x00, 0x01, 0x02, 0x03]))
test(readTest, '/baz', Buffer.from([0x00, 0x01, 0x02, 0x03]))
test(readTest, 'doesnotexist', null, (t, err) => {
  t.truthy(err instanceof NotFoundError)
  t.truthy(err.notFound)
})
test(readTest, 'dir/', null, (t, err) => {
  t.truthy(err instanceof NotAFileError)
  t.truthy(err.notAFile)
})

readTest.title = (_, path) => `readFile(${path}) test (w/fs)`
test('create vault w/fs', async t => {
  target = await tutil.createFs([
    'foo',
    'foo2/',
    'foo2/bar',
    { name: 'baz', content: Buffer.from([0x00, 0x01, 0x02, 0x03]) },
    'dir/'
  ])
})

test(readTest, 'foo', 'content')
test(readTest, '/foo', 'content')
test(readTest, 'foo2/bar', 'content')
test(readTest, '/foo2/bar', 'content')
test(readTest, 'baz', Buffer.from([0x00, 0x01, 0x02, 0x03]))
test(readTest, '/baz', Buffer.from([0x00, 0x01, 0x02, 0x03]))
test(readTest, 'doesnotexist', null, (t, err) => {
  t.truthy(err instanceof NotFoundError)
  t.truthy(err.notFound)
})
test(readTest, 'dir/', null, (t, err) => {
  t.truthy(err instanceof NotAFileError)
  t.truthy(err.notAFile)
})

test('readFile encodings', async t => {
  var vault = await tutil.createVault([
    { name: 'buf', content: Buffer.from([0x00, 0x01, 0x02, 0x03]) }
  ])

  await t.deepEqual(await dpackapi.readFile(vault, 'buf', 'binary'), Buffer.from([0x00, 0x01, 0x02, 0x03]))
  await t.deepEqual(await dpackapi.readFile(vault, 'buf', 'hex'), '00010203')
  await t.deepEqual(await dpackapi.readFile(vault, 'buf', 'base64'), 'AAECAw==')
})

test('readFile encodings w/fs', async t => {
  var fs = await tutil.createFs([
    { name: 'buf', content: Buffer.from([0x00, 0x01, 0x02, 0x03]) }
  ])

  await t.deepEqual(await dpackapi.readFile(fs, 'buf', 'binary'), Buffer.from([0x00, 0x01, 0x02, 0x03]))
  await t.deepEqual(await dpackapi.readFile(fs, 'buf', 'hex'), '00010203')
  await t.deepEqual(await dpackapi.readFile(fs, 'buf', 'base64'), 'AAECAw==')
})

test('readdir', async t => {
  var vault = await tutil.createVault([
    'foo/',
    'foo/bar',
    'baz'
  ])

  t.deepEqual(await dpackapi.readdir(vault, ''), ['foo', 'baz'])
  t.deepEqual(await dpackapi.readdir(vault, '/'), ['foo', 'baz'])
  t.deepEqual(await dpackapi.readdir(vault, 'foo'), ['bar'])
  t.deepEqual(await dpackapi.readdir(vault, '/foo'), ['bar'])
  t.deepEqual(await dpackapi.readdir(vault, '/foo/'), ['bar'])
})

test('readdir w/fs', async t => {
  var fs = await tutil.createFs([
    'foo/',
    'foo/bar',
    'baz'
  ])

  t.deepEqual((await dpackapi.readdir(fs, '')).sort(), ['baz', 'foo'])
  t.deepEqual((await dpackapi.readdir(fs, '/')).sort(), ['baz', 'foo'])
  t.deepEqual(await dpackapi.readdir(fs, 'foo'), ['bar'])
  t.deepEqual(await dpackapi.readdir(fs, '/foo'), ['bar'])
  t.deepEqual(await dpackapi.readdir(fs, '/foo/'), ['bar'])
})

test('readdir recursive', async t => {
  var vault = await tutil.createVault([
    'a',
    'b/',
    'b/a',
    'b/b/',
    'b/b/a',
    'b/b/b',
    'b/c/',
    'c/',
    'c/a',
    'c/b'
  ])

  t.deepEqual((await dpackapi.readdir(vault, '/', {recursive: true})).map(tutil.tonix).sort(), [
    'a',
    'b',
    'b/a',
    'b/b',
    'b/b/a',
    'b/b/b',
    'b/c',
    'c',
    'c/a',
    'c/b'
  ])

  t.deepEqual((await dpackapi.readdir(vault, '/b', {recursive: true})).map(tutil.tonix).map(stripPrecedingSlash).sort(), [
    'a',
    'b',
    'b/a',
    'b/b',
    'c'
  ])

  t.deepEqual((await dpackapi.readdir(vault, '/b/b', {recursive: true})).map(tutil.tonix).sort(), [
    'a',
    'b'
  ])

  t.deepEqual((await dpackapi.readdir(vault, '/c', {recursive: true})).map(tutil.tonix).sort(), [
    'a',
    'b'
  ])
})

test('readdir recursive w/fs', async t => {
  var fs = await tutil.createFs([
    'a',
    'b/',
    'b/a',
    'b/b/',
    'b/b/a',
    'b/b/b',
    'b/c/',
    'c/',
    'c/a',
    'c/b'
  ])

  t.deepEqual((await dpackapi.readdir(fs, '/', {recursive: true})).map(tutil.tonix).sort(), [
    'a',
    'b',
    'b/a',
    'b/b',
    'b/b/a',
    'b/b/b',
    'b/c',
    'c',
    'c/a',
    'c/b'
  ])

  t.deepEqual((await dpackapi.readdir(fs, '/b', {recursive: true})).map(tutil.tonix).map(stripPrecedingSlash).sort(), [
    'a',
    'b',
    'b/a',
    'b/b',
    'c'
  ])

  t.deepEqual((await dpackapi.readdir(fs, '/b/b', {recursive: true})).map(tutil.tonix).sort(), [
    'a',
    'b'
  ])

  t.deepEqual((await dpackapi.readdir(fs, '/c', {recursive: true})).map(tutil.tonix).sort(), [
    'a',
    'b'
  ])
})

test('readSize', async t => {
  var vault1 = await tutil.createVault([
    'a'
  ])
  var vault2 = await tutil.createVault([
    'a',
    'b/',
    'b/a',
    'b/b/',
    'b/b/a',
    'b/b/b',
    'b/c/',
    'c/',
    'c/a',
    'c/b'
  ])

  var size1 = await dpackapi.readSize(vault1, '/')
  var size2 = await dpackapi.readSize(vault2, '/')

  t.truthy(size1 > 0)
  t.truthy(size2 > 0)
  t.truthy(size2 > size1)

  var size3 = await dpackapi.readSize(vault2, '/b')

  t.truthy(size3 > 0)
})

test('readSize w/fs', async t => {
  var fs1 = await tutil.createVault([
    'a'
  ])
  var fs2 = await tutil.createVault([
    'a',
    'b/',
    'b/a',
    'b/b/',
    'b/b/a',
    'b/b/b',
    'b/c/',
    'c/',
    'c/a',
    'c/b'
  ])

  var size1 = await dpackapi.readSize(fs1, '/')
  var size2 = await dpackapi.readSize(fs2, '/')

  t.truthy(size1 > 0)
  t.truthy(size2 > 0)
  t.truthy(size2 > size1)

  var size3 = await dpackapi.readSize(fs2, '/b')

  t.truthy(size3 > 0)
})


function stripPrecedingSlash (str) {
  if (str.charAt(0) == '/') return str.slice(1)
  return str
}
