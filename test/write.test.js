const test = require('ava')
const ddrive = require('@ddrive/core')
const tutil = require('./util')
const dwebapi = require('../index')

test('writeFile', async t => {
  var vault = await tutil.createVault([
    'foo'
  ])

  t.deepEqual(await dwebapi.readFile(vault, 'foo'), 'content')
  await dwebapi.writeFile(vault, '/foo', 'new content')
  t.deepEqual(await dwebapi.readFile(vault, 'foo'), 'new content')
  await dwebapi.writeFile(vault, 'foo', Buffer.from([0x01]))
  t.deepEqual(await dwebapi.readFile(vault, 'foo', 'buffer'), Buffer.from([0x01]))
  await dwebapi.writeFile(vault, 'foo', '02', 'hex')
  t.deepEqual(await dwebapi.readFile(vault, 'foo', 'buffer'), Buffer.from([0x02]))
  await dwebapi.writeFile(vault, 'foo', 'Aw==', { encoding: 'base64' })
  t.deepEqual(await dwebapi.readFile(vault, 'foo', 'buffer'), Buffer.from([0x03]))
})

test('writeFile w/fs', async t => {
  var fs = await tutil.createFs([
    'foo'
  ])

  t.deepEqual(await dwebapi.readFile(fs, 'foo'), 'content')
  await dwebapi.writeFile(fs, '/foo', 'new content')
  t.deepEqual(await dwebapi.readFile(fs, 'foo'), 'new content')
  await dwebapi.writeFile(fs, 'foo', Buffer.from([0x01]))
  t.deepEqual(await dwebapi.readFile(fs, 'foo', 'buffer'), Buffer.from([0x01]))
  await dwebapi.writeFile(fs, 'foo', '02', 'hex')
  t.deepEqual(await dwebapi.readFile(fs, 'foo', 'buffer'), Buffer.from([0x02]))
  await dwebapi.writeFile(fs, 'foo', 'Aw==', { encoding: 'base64' })
  t.deepEqual(await dwebapi.readFile(fs, 'foo', 'buffer'), Buffer.from([0x03]))
})

test('mkdir', async t => {
  var vault = await tutil.createVault([
    'foo'
  ])

  await dwebapi.mkdir(vault, '/bar')
  t.deepEqual((await dwebapi.readdir(vault, '/')).sort(), ['bar', 'foo'])
  t.deepEqual((await dwebapi.stat(vault, '/bar')).isDirectory(), true)
})

test('mkdir w/fs', async t => {
  var fs = await tutil.createFs([
    'foo'
  ])

  await dwebapi.mkdir(fs, '/bar')
  t.deepEqual((await dwebapi.readdir(fs, '/')).sort(), ['bar', 'foo'])
  t.deepEqual((await dwebapi.stat(fs, '/bar')).isDirectory(), true)
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

  await dwebapi.copy(vault, '/a', '/a-copy')
  t.deepEqual(await dwebapi.readFile(vault, '/a-copy'), 'thecopy')
  t.deepEqual((await dwebapi.stat(vault, '/a-copy')).isFile(), true)

  await dwebapi.copy(vault, '/b', '/b-copy')
  t.deepEqual((await dwebapi.stat(vault, '/b-copy')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(vault, '/b-copy/a'), 'content')
  t.deepEqual((await dwebapi.stat(vault, '/b-copy/b')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(vault, '/b-copy/b/a'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, '/b-copy/b/b'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, '/b-copy/b/c'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, '/b-copy/c'), 'content')

  await dwebapi.copy(vault, '/b/b', '/c')
  t.deepEqual((await dwebapi.stat(vault, '/c')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(vault, 'c/a'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, 'c/b'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, 'c/c'), 'content')
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

  await dwebapi.copy(fs, '/a', '/a-copy')
  t.deepEqual(await dwebapi.readFile(fs, '/a-copy'), 'thecopy')
  t.deepEqual((await dwebapi.stat(fs, '/a-copy')).isFile(), true)

  await dwebapi.copy(fs, '/b', '/b-copy')
  t.deepEqual((await dwebapi.stat(fs, '/b-copy')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(fs, '/b-copy/a'), 'content')
  t.deepEqual((await dwebapi.stat(fs, '/b-copy/b')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(fs, '/b-copy/b/a'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, '/b-copy/b/b'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, '/b-copy/b/c'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, '/b-copy/c'), 'content')

  await dwebapi.copy(fs, '/b/b', '/c')
  t.deepEqual((await dwebapi.stat(fs, '/c')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(fs, 'c/a'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, 'c/b'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, 'c/c'), 'content')
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

  await dwebapi.rename(vault, '/a', '/a-rename')
  t.deepEqual(await dwebapi.readFile(vault, '/a-rename'), 'content')
  t.deepEqual((await dwebapi.stat(vault, '/a-rename')).isFile(), true)

  await dwebapi.rename(vault, '/b', '/b-rename')
  t.deepEqual((await dwebapi.stat(vault, '/b-rename')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(vault, '/b-rename/a'), 'content')
  t.deepEqual((await dwebapi.stat(vault, '/b-rename/b')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(vault, '/b-rename/b/a'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, '/b-rename/b/b'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, '/b-rename/b/c'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, '/b-rename/c'), 'content')

  await dwebapi.rename(vault, '/b-rename/b', '/c/newb')
  t.deepEqual((await dwebapi.stat(vault, '/c/newb')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(vault, 'c/newb/a'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, 'c/newb/b'), 'content')
  t.deepEqual(await dwebapi.readFile(vault, 'c/newb/c'), 'content')
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

  await dwebapi.rename(fs, '/a', '/a-rename')
  t.deepEqual(await dwebapi.readFile(fs, '/a-rename'), 'content')
  t.deepEqual((await dwebapi.stat(fs, '/a-rename')).isFile(), true)

  await dwebapi.rename(fs, '/b', '/b-rename')
  t.deepEqual((await dwebapi.stat(fs, '/b-rename')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(fs, '/b-rename/a'), 'content')
  t.deepEqual((await dwebapi.stat(fs, '/b-rename/b')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(fs, '/b-rename/b/a'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, '/b-rename/b/b'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, '/b-rename/b/c'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, '/b-rename/c'), 'content')

  await dwebapi.rename(fs, '/b-rename/b', '/c/newb')
  t.deepEqual((await dwebapi.stat(fs, '/c/newb')).isDirectory(), true)
  t.deepEqual(await dwebapi.readFile(fs, 'c/newb/a'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, 'c/newb/b'), 'content')
  t.deepEqual(await dwebapi.readFile(fs, 'c/newb/c'), 'content')
})

test('EntryAlreadyExistsError', async t => {
  var vault = await tutil.createVault([])
  await new Promise(resolve => vault.ready(resolve))

  await dwebapi.mkdir(vault, '/dir')
  const err1 = await t.throws(dwebapi.writeFile(vault, '/dir', 'new content'))
  t.truthy(err1.entryAlreadyExists)

  await dwebapi.writeFile(vault, '/file', 'new content')
  const err2 = await t.throws(dwebapi.mkdir(vault, '/file'))
  t.truthy(err2.entryAlreadyExists)

  const err3 = await t.throws(dwebapi.copy(vault, '/dir', '/file'))
  t.truthy(err3.entryAlreadyExists)

  const err4 = await t.throws(dwebapi.copy(vault, '/file', '/dir'))
  t.truthy(err4.entryAlreadyExists)

  const err5 = await t.throws(dwebapi.rename(vault, '/dir', '/file'))
  t.truthy(err5.entryAlreadyExists)

  const err6 = await t.throws(dwebapi.rename(vault, '/file', '/dir'))
  t.truthy(err6.entryAlreadyExists)
})

test('EntryAlreadyExistsError w/fs', async t => {
  var fs = await tutil.createFs([])

  await dwebapi.mkdir(fs, '/dir')
  const err1 = await t.throws(dwebapi.writeFile(fs, '/dir', 'new content'))
  t.truthy(err1.entryAlreadyExists)

  await dwebapi.writeFile(fs, '/file', 'new content')
  const err2 = await t.throws(dwebapi.mkdir(fs, '/file'))
  t.truthy(err2.entryAlreadyExists)

  const err3 = await t.throws(dwebapi.copy(fs, '/dir', '/file'))
  t.truthy(err3.entryAlreadyExists)

  const err4 = await t.throws(dwebapi.copy(fs, '/file', '/dir'))
  t.truthy(err4.entryAlreadyExists)

  const err5 = await t.throws(dwebapi.rename(fs, '/dir', '/file'))
  t.truthy(err5.entryAlreadyExists)

  const err6 = await t.throws(dwebapi.rename(fs, '/file', '/dir'))
  t.truthy(err6.entryAlreadyExists)
})

test('VaultNotWritableError', async t => {
  const vault = ddrive(tutil.tmpdir(), tutil.FAKE_DWEB_KEY, {createIfMissing: false})
  await new Promise(resolve => vault.ready(resolve))

  const err1 = await t.throws(dwebapi.mkdir(vault, '/bar'))
  t.truthy(err1.vaultNotWritable)

  const err2 = await t.throws(dwebapi.writeFile(vault, '/bar', 'foo'))
  t.truthy(err2.vaultNotWritable)

  const err3 = await t.throws(dwebapi.copy(vault, '/foo', '/bar'))
  t.truthy(err3.vaultNotWritable)

  const err4 = await t.throws(dwebapi.rename(vault, '/foo', '/bar'))
  t.truthy(err4.vaultNotWritable)
})

test('InvalidPathError', async t => {
  var vault = await tutil.createVault([])
  await new Promise(resolve => vault.ready(resolve))

  const err1 = await t.throws(dwebapi.writeFile(vault, '/foo%20bar', 'new content'))
  t.truthy(err1.invalidPath)

  const err2 = await t.throws(dwebapi.mkdir(vault, '/foo%20bar'))
  t.truthy(err2.invalidPath)

  const err3 = await t.throws(dwebapi.copy(vault, '/foo', '/foo%20bar'))
  t.truthy(err3.invalidPath)

  const err4 = await t.throws(dwebapi.rename(vault, '/foo', '/foo%20bar'))
  t.truthy(err4.invalidPath)

  const noerr = await dwebapi.mkdir(vault, '/foo bar')
  t.truthy(typeof noerr === 'undefined')
})

test('InvalidPathError w/fs', async t => {
  var fs = await tutil.createFs([])

  const err1 = await t.throws(dwebapi.writeFile(fs, '/foo%20bar', 'new content'))
  t.truthy(err1.invalidPath)

  const err2 = await t.throws(dwebapi.mkdir(fs, '/foo%20bar'))
  t.truthy(err2.invalidPath)

  const err3 = await t.throws(dwebapi.copy(fs, '/foo', '/foo%20bar'))
  t.truthy(err3.invalidPath)

  const err4 = await t.throws(dwebapi.rename(fs, '/foo', '/foo%20bar'))
  t.truthy(err4.invalidPath)

  const noerr = await dwebapi.mkdir(fs, '/foo bar')
  t.truthy(typeof noerr === 'undefined')
})

test('ParentFolderDoesntExistError', async t => {
  var vault = await tutil.createVault([
    'foo'
  ])

  const err1 = await t.throws(dwebapi.writeFile(vault, '/bar/foo', 'new content'))
  t.truthy(err1.parentFolderDoesntExist)

  const err2 = await t.throws(dwebapi.writeFile(vault, '/foo/bar', 'new content'))
  t.truthy(err2.parentFolderDoesntExist)

  const err3 = await t.throws(dwebapi.mkdir(vault, '/bar/foo'))
  t.truthy(err3.parentFolderDoesntExist)

  const err4 = await t.throws(dwebapi.mkdir(vault, '/foo/bar'))
  t.truthy(err4.parentFolderDoesntExist)

  const err5 = await t.throws(dwebapi.copy(vault, '/foo', '/bar/foo'))
  t.truthy(err5.parentFolderDoesntExist)

  const err6 = await t.throws(dwebapi.copy(vault, '/foo', '/foo/bar'))
  t.truthy(err6.parentFolderDoesntExist)

  const err7 = await t.throws(dwebapi.rename(vault, '/foo', '/bar/foo'))
  t.truthy(err7.parentFolderDoesntExist)

  const err8 = await t.throws(dwebapi.rename(vault, '/foo', '/foo/bar'))
  t.truthy(err8.parentFolderDoesntExist)
})

test('ParentFolderDoesntExistError w/fs', async t => {
  var fs = await tutil.createFs([
    'foo'
  ])

  const err1 = await t.throws(dwebapi.writeFile(fs, '/bar/foo', 'new content'))
  t.truthy(err1.parentFolderDoesntExist)

  const err2 = await t.throws(dwebapi.writeFile(fs, '/foo/bar', 'new content'))
  t.truthy(err2.parentFolderDoesntExist)

  const err3 = await t.throws(dwebapi.mkdir(fs, '/bar/foo'))
  t.truthy(err3.parentFolderDoesntExist)

  const err4 = await t.throws(dwebapi.mkdir(fs, '/foo/bar'))
  t.truthy(err4.parentFolderDoesntExist)

  const err5 = await t.throws(dwebapi.copy(fs, '/foo', '/bar/foo'))
  t.truthy(err5.parentFolderDoesntExist)

  const err6 = await t.throws(dwebapi.copy(fs, '/foo', '/foo/bar'))
  t.truthy(err6.parentFolderDoesntExist)

  const err7 = await t.throws(dwebapi.rename(fs, '/foo', '/bar/foo'))
  t.truthy(err7.parentFolderDoesntExist)

  const err8 = await t.throws(dwebapi.rename(fs, '/foo', '/foo/bar'))
  t.truthy(err8.parentFolderDoesntExist)
})
