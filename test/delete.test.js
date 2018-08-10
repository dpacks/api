const test = require('ava')
const ddrive = require('@ddrive/core')
const tutil = require('./util')
const dwebapi = require('../index')

test('unlink', async t => {
  var vault = await tutil.createVault([
    'a',
    'b/',
    'b/a',
    'c/',
    'c/b/',
    'c/b/a'
  ])

  await dwebapi.unlink(vault, '/a')
  await t.throws(dwebapi.stat(vault, '/a'))
  await dwebapi.unlink(vault, 'b/a')
  await t.throws(dwebapi.stat(vault, 'b/a'))
  await dwebapi.unlink(vault, '/c/b/a')
  await t.throws(dwebapi.stat(vault, '/c/b/a'))
  t.deepEqual((await dwebapi.readdir(vault, '/', {recursive: true})).sort().map(tutil.tonix), ['b', 'c', 'c/b'])
})

test('unlink NotFoundError, NotAFileError', async t => {
  var vault = await tutil.createVault([
    'a',
    'b/',
    'b/a',
    'c/',
    'c/b/',
    'c/b/a'
  ])

  const err1 = await t.throws(dwebapi.unlink(vault, '/bar'))
  t.truthy(err1.notFound)
  const err2 = await t.throws(dwebapi.unlink(vault, '/b'))
  t.truthy(err2.notAFile)
})

test('rmdir', async t => {
  var vault = await tutil.createVault([
    'a',
    'b/',
    'b/a/',
    'c/',
    'c/b/'
  ])

  await dwebapi.rmdir(vault, 'b/a')
  await dwebapi.rmdir(vault, 'b')
  await dwebapi.rmdir(vault, 'c/b')
  t.deepEqual((await dwebapi.readdir(vault, '/', {recursive: true})).sort(), ['a', 'c'])
})

test('rmdir recursive', async t => {
  var vault = await tutil.createVault([
    'a',
    'b/',
    'b/a/',
    'b/b',
    'b/c',
    'b/d/',
    'b/d/a',
    'b/d/b',
    'b/d/c/',
    'b/d/c/a',
    'b/d/c/b',
    'b/d/d',
    'c/',
    'c/b/'
  ])

  await dwebapi.rmdir(vault, 'b', {recursive: true})
  t.deepEqual((await dwebapi.readdir(vault, '/', {recursive: true})).map(tutil.tonix).sort(), ['a', 'c', 'c/b'])
})

test('rmdir NotFoundError, NotAFolderError, DestDirectoryNotEmpty', async t => {
  var vault = await tutil.createVault([
    'a',
    'b/',
    'b/a/',
    'c/',
    'c/b/'
  ])

  const err1 = await t.throws(dwebapi.rmdir(vault, '/bar'))
  t.truthy(err1.notFound)
  const err2 = await t.throws(dwebapi.rmdir(vault, '/a'))
  t.truthy(err2.notAFolder)
  const err3 = await t.throws(dwebapi.rmdir(vault, '/b'))
  t.truthy(err3.destDirectoryNotEmpty)
})

test('VaultNotWritableError', async t => {
  const vault = ddrive(tutil.tmpdir(), tutil.FAKE_DWEB_KEY, {createIfMissing: false})
  await new Promise(resolve => vault.ready(resolve))

  const err1 = await t.throws(dwebapi.unlink(vault, '/bar'))
  t.truthy(err1.vaultNotWritable)
  const err2 = await t.throws(dwebapi.rmdir(vault, '/bar'))
  t.truthy(err2.vaultNotWritable)
})

test('unlink w/fs', async t => {
  var fs = await tutil.createFs([
    'a',
    'b/',
    'b/a',
    'c/',
    'c/b/',
    'c/b/a'
  ])

  await dwebapi.unlink(fs, '/a')
  await t.throws(dwebapi.stat(fs, '/a'))
  await dwebapi.unlink(fs, 'b/a')
  await t.throws(dwebapi.stat(fs, 'b/a'))
  await dwebapi.unlink(fs, '/c/b/a')
  await t.throws(dwebapi.stat(fs, '/c/b/a'))
  t.deepEqual((await dwebapi.readdir(fs, '/', {recursive: true})).sort().map(tutil.tonix), ['b', 'c', 'c/b'])
})

test('unlink NotFoundError, NotAFileError w/fs', async t => {
  var fs = await tutil.createFs([
    'a',
    'b/',
    'b/a',
    'c/',
    'c/b/',
    'c/b/a'
  ])

  const err1 = await t.throws(dwebapi.unlink(fs, '/bar'))
  t.truthy(err1.notFound)
  const err2 = await t.throws(dwebapi.unlink(fs, '/b'))
  t.truthy(err2.notAFile)
})

test('rmdir w/fs', async t => {
  var fs = await tutil.createFs([
    'a',
    'b/',
    'b/a/',
    'c/',
    'c/b/'
  ])

  await dwebapi.rmdir(fs, 'b/a')
  await dwebapi.rmdir(fs, 'b')
  await dwebapi.rmdir(fs, 'c/b')
  t.deepEqual((await dwebapi.readdir(fs, '/', {recursive: true})).sort(), ['a', 'c'])
})

test('rmdir recursive w/fs', async t => {
  var fs = await tutil.createFs([
    'a',
    'b/',
    'b/a/',
    'b/b',
    'b/c',
    'b/d/',
    'b/d/a',
    'b/d/b',
    'b/d/c/',
    'b/d/c/a',
    'b/d/c/b',
    'b/d/d',
    'c/',
    'c/b/'
  ])

  await dwebapi.rmdir(fs, 'b', {recursive: true})
  t.deepEqual((await dwebapi.readdir(fs, '/', {recursive: true})).map(tutil.tonix).sort(), ['a', 'c', 'c/b'])
})

test('rmdir NotFoundError, NotAFolderError, DestDirectoryNotEmpty w/fs', async t => {
  var fs = await tutil.createFs([
    'a',
    'b/',
    'b/a/',
    'c/',
    'c/b/'
  ])

  const err1 = await t.throws(dwebapi.rmdir(fs, '/bar'))
  t.truthy(err1.notFound)
  const err2 = await t.throws(dwebapi.rmdir(fs, '/a'))
  t.truthy(err2.notAFolder)
  const err3 = await t.throws(dwebapi.rmdir(fs, '/b'))
  t.truthy(err3.destDirectoryNotEmpty)
})
