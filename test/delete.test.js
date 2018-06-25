const test = require('ava')
const ddrive = require('@ddrive/core')
const tutil = require('./util')
const dpackapi = require('../index')

test('unlink', async t => {
  var vault = await tutil.createVault([
    'a',
    'b/',
    'b/a',
    'c/',
    'c/b/',
    'c/b/a'
  ])

  await dpackapi.unlink(vault, '/a')
  await t.throws(dpackapi.stat(vault, '/a'))
  await dpackapi.unlink(vault, 'b/a')
  await t.throws(dpackapi.stat(vault, 'b/a'))
  await dpackapi.unlink(vault, '/c/b/a')
  await t.throws(dpackapi.stat(vault, '/c/b/a'))
  t.deepEqual((await dpackapi.readdir(vault, '/', {recursive: true})).sort().map(tutil.tonix), ['b', 'c', 'c/b'])
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

  const err1 = await t.throws(dpackapi.unlink(vault, '/bar'))
  t.truthy(err1.notFound)
  const err2 = await t.throws(dpackapi.unlink(vault, '/b'))
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

  await dpackapi.rmdir(vault, 'b/a')
  await dpackapi.rmdir(vault, 'b')
  await dpackapi.rmdir(vault, 'c/b')
  t.deepEqual((await dpackapi.readdir(vault, '/', {recursive: true})).sort(), ['a', 'c'])
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

  await dpackapi.rmdir(vault, 'b', {recursive: true})
  t.deepEqual((await dpackapi.readdir(vault, '/', {recursive: true})).map(tutil.tonix).sort(), ['a', 'c', 'c/b'])
})

test('rmdir NotFoundError, NotAFolderError, DestDirectoryNotEmpty', async t => {
  var vault = await tutil.createVault([
    'a',
    'b/',
    'b/a/',
    'c/',
    'c/b/'
  ])

  const err1 = await t.throws(dpackapi.rmdir(vault, '/bar'))
  t.truthy(err1.notFound)
  const err2 = await t.throws(dpackapi.rmdir(vault, '/a'))
  t.truthy(err2.notAFolder)
  const err3 = await t.throws(dpackapi.rmdir(vault, '/b'))
  t.truthy(err3.destDirectoryNotEmpty)
})

test('VaultNotWritableError', async t => {
  const vault = ddrive(tutil.tmpdir(), tutil.FAKE_DPACK_KEY, {createIfMissing: false})
  await new Promise(resolve => vault.ready(resolve))

  const err1 = await t.throws(dpackapi.unlink(vault, '/bar'))
  t.truthy(err1.vaultNotWritable)
  const err2 = await t.throws(dpackapi.rmdir(vault, '/bar'))
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

  await dpackapi.unlink(fs, '/a')
  await t.throws(dpackapi.stat(fs, '/a'))
  await dpackapi.unlink(fs, 'b/a')
  await t.throws(dpackapi.stat(fs, 'b/a'))
  await dpackapi.unlink(fs, '/c/b/a')
  await t.throws(dpackapi.stat(fs, '/c/b/a'))
  t.deepEqual((await dpackapi.readdir(fs, '/', {recursive: true})).sort().map(tutil.tonix), ['b', 'c', 'c/b'])
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

  const err1 = await t.throws(dpackapi.unlink(fs, '/bar'))
  t.truthy(err1.notFound)
  const err2 = await t.throws(dpackapi.unlink(fs, '/b'))
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

  await dpackapi.rmdir(fs, 'b/a')
  await dpackapi.rmdir(fs, 'b')
  await dpackapi.rmdir(fs, 'c/b')
  t.deepEqual((await dpackapi.readdir(fs, '/', {recursive: true})).sort(), ['a', 'c'])
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

  await dpackapi.rmdir(fs, 'b', {recursive: true})
  t.deepEqual((await dpackapi.readdir(fs, '/', {recursive: true})).map(tutil.tonix).sort(), ['a', 'c', 'c/b'])
})

test('rmdir NotFoundError, NotAFolderError, DestDirectoryNotEmpty w/fs', async t => {
  var fs = await tutil.createFs([
    'a',
    'b/',
    'b/a/',
    'c/',
    'c/b/'
  ])

  const err1 = await t.throws(dpackapi.rmdir(fs, '/bar'))
  t.truthy(err1.notFound)
  const err2 = await t.throws(dpackapi.rmdir(fs, '/a'))
  t.truthy(err2.notAFolder)
  const err3 = await t.throws(dpackapi.rmdir(fs, '/b'))
  t.truthy(err3.destDirectoryNotEmpty)
})
