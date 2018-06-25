const test = require('ava')
const ddrive = require('@ddrive/core')
const tutil = require('./util')
const dpackapi = require('../index')

test('writeFile', async t => {
  var vault = await tutil.createVault([
    'foo'
  ])

  t.deepEqual(await dpackapi.readFile(vault, 'foo'), 'content')
  await dpackapi.writeFile(vault, '/foo', 'new content')
  t.deepEqual(await dpackapi.readFile(vault, 'foo'), 'new content')
  await dpackapi.writeFile(vault, 'foo', Buffer.from([0x01]))
  t.deepEqual(await dpackapi.readFile(vault, 'foo', 'buffer'), Buffer.from([0x01]))
  await dpackapi.writeFile(vault, 'foo', '02', 'hex')
  t.deepEqual(await dpackapi.readFile(vault, 'foo', 'buffer'), Buffer.from([0x02]))
  await dpackapi.writeFile(vault, 'foo', 'Aw==', { encoding: 'base64' })
  t.deepEqual(await dpackapi.readFile(vault, 'foo', 'buffer'), Buffer.from([0x03]))
})

test('writeFile w/fs', async t => {
  var fs = await tutil.createFs([
    'foo'
  ])

  t.deepEqual(await dpackapi.readFile(fs, 'foo'), 'content')
  await dpackapi.writeFile(fs, '/foo', 'new content')
  t.deepEqual(await dpackapi.readFile(fs, 'foo'), 'new content')
  await dpackapi.writeFile(fs, 'foo', Buffer.from([0x01]))
  t.deepEqual(await dpackapi.readFile(fs, 'foo', 'buffer'), Buffer.from([0x01]))
  await dpackapi.writeFile(fs, 'foo', '02', 'hex')
  t.deepEqual(await dpackapi.readFile(fs, 'foo', 'buffer'), Buffer.from([0x02]))
  await dpackapi.writeFile(fs, 'foo', 'Aw==', { encoding: 'base64' })
  t.deepEqual(await dpackapi.readFile(fs, 'foo', 'buffer'), Buffer.from([0x03]))
})

test('mkdir', async t => {
  var vault = await tutil.createVault([
    'foo'
  ])

  await dpackapi.mkdir(vault, '/bar')
  t.deepEqual((await dpackapi.readdir(vault, '/')).sort(), ['bar', 'foo'])
  t.deepEqual((await dpackapi.stat(vault, '/bar')).isDirectory(), true)
})

test('mkdir w/fs', async t => {
  var fs = await tutil.createFs([
    'foo'
  ])

  await dpackapi.mkdir(fs, '/bar')
  t.deepEqual((await dpackapi.readdir(fs, '/')).sort(), ['bar', 'foo'])
  t.deepEqual((await dpackapi.stat(fs, '/bar')).isDirectory(), true)
})

test('copy', async t => {
  var vault = await tutil.createVault([
    {name: 'a', content: 'thecopy'},
    'b/',
    'b/a',
    'b/b/',
    'b/b/a',
    'b/b/b',
    'b/b/c',
    'b/c',
    'c/'
  ])

  await dpackapi.copy(vault, '/a', '/a-copy')
  t.deepEqual(await dpackapi.readFile(vault, '/a-copy'), 'thecopy')
  t.deepEqual((await dpackapi.stat(vault, '/a-copy')).isFile(), true)

  await dpackapi.copy(vault, '/b', '/b-copy')
  t.deepEqual((await dpackapi.stat(vault, '/b-copy')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(vault, '/b-copy/a'), 'content')
  t.deepEqual((await dpackapi.stat(vault, '/b-copy/b')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(vault, '/b-copy/b/a'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, '/b-copy/b/b'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, '/b-copy/b/c'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, '/b-copy/c'), 'content')

  await dpackapi.copy(vault, '/b/b', '/c')
  t.deepEqual((await dpackapi.stat(vault, '/c')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(vault, 'c/a'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, 'c/b'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, 'c/c'), 'content')
})

test('copy w/fs', async t => {
  var fs = await tutil.createFs([
    {name: 'a', content: 'thecopy'},
    'b/',
    'b/a',
    'b/b/',
    'b/b/a',
    'b/b/b',
    'b/b/c',
    'b/c',
    'c/'
  ])

  await dpackapi.copy(fs, '/a', '/a-copy')
  t.deepEqual(await dpackapi.readFile(fs, '/a-copy'), 'thecopy')
  t.deepEqual((await dpackapi.stat(fs, '/a-copy')).isFile(), true)

  await dpackapi.copy(fs, '/b', '/b-copy')
  t.deepEqual((await dpackapi.stat(fs, '/b-copy')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(fs, '/b-copy/a'), 'content')
  t.deepEqual((await dpackapi.stat(fs, '/b-copy/b')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(fs, '/b-copy/b/a'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, '/b-copy/b/b'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, '/b-copy/b/c'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, '/b-copy/c'), 'content')

  await dpackapi.copy(fs, '/b/b', '/c')
  t.deepEqual((await dpackapi.stat(fs, '/c')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(fs, 'c/a'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, 'c/b'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, 'c/c'), 'content')
})

test('rename', async t => {
  var vault = await tutil.createVault([
    'a',
    'b/',
    'b/a',
    'b/b/',
    'b/b/a',
    'b/b/b',
    'b/b/c',
    'b/c',
    'c/'
  ])

  await dpackapi.rename(vault, '/a', '/a-rename')
  t.deepEqual(await dpackapi.readFile(vault, '/a-rename'), 'content')
  t.deepEqual((await dpackapi.stat(vault, '/a-rename')).isFile(), true)

  await dpackapi.rename(vault, '/b', '/b-rename')
  t.deepEqual((await dpackapi.stat(vault, '/b-rename')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(vault, '/b-rename/a'), 'content')
  t.deepEqual((await dpackapi.stat(vault, '/b-rename/b')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(vault, '/b-rename/b/a'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, '/b-rename/b/b'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, '/b-rename/b/c'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, '/b-rename/c'), 'content')

  await dpackapi.rename(vault, '/b-rename/b', '/c/newb')
  t.deepEqual((await dpackapi.stat(vault, '/c/newb')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(vault, 'c/newb/a'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, 'c/newb/b'), 'content')
  t.deepEqual(await dpackapi.readFile(vault, 'c/newb/c'), 'content')
})

test('rename w/fs', async t => {
  var fs = await tutil.createFs([
    'a',
    'b/',
    'b/a',
    'b/b/',
    'b/b/a',
    'b/b/b',
    'b/b/c',
    'b/c',
    'c/'
  ])

  await dpackapi.rename(fs, '/a', '/a-rename')
  t.deepEqual(await dpackapi.readFile(fs, '/a-rename'), 'content')
  t.deepEqual((await dpackapi.stat(fs, '/a-rename')).isFile(), true)

  await dpackapi.rename(fs, '/b', '/b-rename')
  t.deepEqual((await dpackapi.stat(fs, '/b-rename')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(fs, '/b-rename/a'), 'content')
  t.deepEqual((await dpackapi.stat(fs, '/b-rename/b')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(fs, '/b-rename/b/a'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, '/b-rename/b/b'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, '/b-rename/b/c'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, '/b-rename/c'), 'content')

  await dpackapi.rename(fs, '/b-rename/b', '/c/newb')
  t.deepEqual((await dpackapi.stat(fs, '/c/newb')).isDirectory(), true)
  t.deepEqual(await dpackapi.readFile(fs, 'c/newb/a'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, 'c/newb/b'), 'content')
  t.deepEqual(await dpackapi.readFile(fs, 'c/newb/c'), 'content')
})

test('EntryAlreadyExistsError', async t => {
  var vault = await tutil.createVault([])
  await new Promise(resolve => vault.ready(resolve))

  await dpackapi.mkdir(vault, '/dir')
  const err1 = await t.throws(dpackapi.writeFile(vault, '/dir', 'new content'))
  t.truthy(err1.entryAlreadyExists)

  await dpackapi.writeFile(vault, '/file', 'new content')
  const err2 = await t.throws(dpackapi.mkdir(vault, '/file'))
  t.truthy(err2.entryAlreadyExists)

  const err3 = await t.throws(dpackapi.copy(vault, '/dir', '/file'))
  t.truthy(err3.entryAlreadyExists)

  const err4 = await t.throws(dpackapi.copy(vault, '/file', '/dir'))
  t.truthy(err4.entryAlreadyExists)

  const err5 = await t.throws(dpackapi.rename(vault, '/dir', '/file'))
  t.truthy(err5.entryAlreadyExists)

  const err6 = await t.throws(dpackapi.rename(vault, '/file', '/dir'))
  t.truthy(err6.entryAlreadyExists)
})

test('EntryAlreadyExistsError w/fs', async t => {
  var fs = await tutil.createFs([])

  await dpackapi.mkdir(fs, '/dir')
  const err1 = await t.throws(dpackapi.writeFile(fs, '/dir', 'new content'))
  t.truthy(err1.entryAlreadyExists)

  await dpackapi.writeFile(fs, '/file', 'new content')
  const err2 = await t.throws(dpackapi.mkdir(fs, '/file'))
  t.truthy(err2.entryAlreadyExists)

  const err3 = await t.throws(dpackapi.copy(fs, '/dir', '/file'))
  t.truthy(err3.entryAlreadyExists)

  const err4 = await t.throws(dpackapi.copy(fs, '/file', '/dir'))
  t.truthy(err4.entryAlreadyExists)

  const err5 = await t.throws(dpackapi.rename(fs, '/dir', '/file'))
  t.truthy(err5.entryAlreadyExists)

  const err6 = await t.throws(dpackapi.rename(fs, '/file', '/dir'))
  t.truthy(err6.entryAlreadyExists)
})

test('VaultNotWritableError', async t => {
  const vault = ddrive(tutil.tmpdir(), tutil.FAKE_DPACK_KEY, {createIfMissing: false})
  await new Promise(resolve => vault.ready(resolve))

  const err1 = await t.throws(dpackapi.mkdir(vault, '/bar'))
  t.truthy(err1.vaultNotWritable)

  const err2 = await t.throws(dpackapi.writeFile(vault, '/bar', 'foo'))
  t.truthy(err2.vaultNotWritable)

  const err3 = await t.throws(dpackapi.copy(vault, '/foo', '/bar'))
  t.truthy(err3.vaultNotWritable)

  const err4 = await t.throws(dpackapi.rename(vault, '/foo', '/bar'))
  t.truthy(err4.vaultNotWritable)
})

test('InvalidPathError', async t => {
  var vault = await tutil.createVault([])
  await new Promise(resolve => vault.ready(resolve))

  const err1 = await t.throws(dpackapi.writeFile(vault, '/foo%20bar', 'new content'))
  t.truthy(err1.invalidPath)

  const err2 = await t.throws(dpackapi.mkdir(vault, '/foo%20bar'))
  t.truthy(err2.invalidPath)

  const err3 = await t.throws(dpackapi.copy(vault, '/foo', '/foo%20bar'))
  t.truthy(err3.invalidPath)

  const err4 = await t.throws(dpackapi.rename(vault, '/foo', '/foo%20bar'))
  t.truthy(err4.invalidPath)

  const noerr = await dpackapi.mkdir(vault, '/foo bar')
  t.truthy(typeof noerr === 'undefined')
})

test('InvalidPathError w/fs', async t => {
  var fs = await tutil.createFs([])

  const err1 = await t.throws(dpackapi.writeFile(fs, '/foo%20bar', 'new content'))
  t.truthy(err1.invalidPath)

  const err2 = await t.throws(dpackapi.mkdir(fs, '/foo%20bar'))
  t.truthy(err2.invalidPath)

  const err3 = await t.throws(dpackapi.copy(fs, '/foo', '/foo%20bar'))
  t.truthy(err3.invalidPath)

  const err4 = await t.throws(dpackapi.rename(fs, '/foo', '/foo%20bar'))
  t.truthy(err4.invalidPath)

  const noerr = await dpackapi.mkdir(fs, '/foo bar')
  t.truthy(typeof noerr === 'undefined')
})

test('ParentFolderDoesntExistError', async t => {
  var vault = await tutil.createVault([
    'foo'
  ])

  const err1 = await t.throws(dpackapi.writeFile(vault, '/bar/foo', 'new content'))
  t.truthy(err1.parentFolderDoesntExist)

  const err2 = await t.throws(dpackapi.writeFile(vault, '/foo/bar', 'new content'))
  t.truthy(err2.parentFolderDoesntExist)

  const err3 = await t.throws(dpackapi.mkdir(vault, '/bar/foo'))
  t.truthy(err3.parentFolderDoesntExist)

  const err4 = await t.throws(dpackapi.mkdir(vault, '/foo/bar'))
  t.truthy(err4.parentFolderDoesntExist)

  const err5 = await t.throws(dpackapi.copy(vault, '/foo', '/bar/foo'))
  t.truthy(err5.parentFolderDoesntExist)

  const err6 = await t.throws(dpackapi.copy(vault, '/foo', '/foo/bar'))
  t.truthy(err6.parentFolderDoesntExist)

  const err7 = await t.throws(dpackapi.rename(vault, '/foo', '/bar/foo'))
  t.truthy(err7.parentFolderDoesntExist)

  const err8 = await t.throws(dpackapi.rename(vault, '/foo', '/foo/bar'))
  t.truthy(err8.parentFolderDoesntExist)
})

test('ParentFolderDoesntExistError w/fs', async t => {
  var fs = await tutil.createFs([
    'foo'
  ])

  const err1 = await t.throws(dpackapi.writeFile(fs, '/bar/foo', 'new content'))
  t.truthy(err1.parentFolderDoesntExist)

  const err2 = await t.throws(dpackapi.writeFile(fs, '/foo/bar', 'new content'))
  t.truthy(err2.parentFolderDoesntExist)

  const err3 = await t.throws(dpackapi.mkdir(fs, '/bar/foo'))
  t.truthy(err3.parentFolderDoesntExist)

  const err4 = await t.throws(dpackapi.mkdir(fs, '/foo/bar'))
  t.truthy(err4.parentFolderDoesntExist)

  const err5 = await t.throws(dpackapi.copy(fs, '/foo', '/bar/foo'))
  t.truthy(err5.parentFolderDoesntExist)

  const err6 = await t.throws(dpackapi.copy(fs, '/foo', '/foo/bar'))
  t.truthy(err6.parentFolderDoesntExist)

  const err7 = await t.throws(dpackapi.rename(fs, '/foo', '/bar/foo'))
  t.truthy(err7.parentFolderDoesntExist)

  const err8 = await t.throws(dpackapi.rename(fs, '/foo', '/foo/bar'))
  t.truthy(err8.parentFolderDoesntExist)
})
