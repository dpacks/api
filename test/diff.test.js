const test = require('ava')
const tutil = require('./util')
const dpackapi = require('../index')

test('diff against empty', async t => {
  var changes

  const srcVault = await tutil.createVault([
    'foo.txt',
    { name: 'bar.data', content: Buffer.from([0x00, 0x01]) },
    'subdir/',
    'subdir/foo.txt',
    { name: 'subdir/bar.data', content: Buffer.from([0x00, 0x01]) }
  ])
  const dstVault = await tutil.createVault()

  await new Promise(resolve => srcVault.ready(resolve))
  await new Promise(resolve => dstVault.ready(resolve))

  // diff root against empty root, shallow=false, filter=none, ops=all
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/')
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'add', type: 'file', path: '/foo.txt' },
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'add', type: 'dir', path: '/subdir' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' }
  ])

  // diff root against empty root, shallow=true, filter=none, ops=all
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/', {shallow: true})
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'add', type: 'file', path: '/foo.txt' },
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'add', type: 'dir', path: '/subdir' }
  ])

  // diff root against empty root, shallow=false, filter=yes, ops=all
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/', {paths: ['/foo.txt', '/subdir']})
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'add', type: 'file', path: '/foo.txt' },
    { change: 'add', type: 'dir', path: '/subdir' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' }
  ])

  // diff root against empty root, shallow=false, filter=none, ops=mod
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/', {ops: ['mod']})
  t.deepEqual(changes, [])

  // diff subdir against empty root, shallow=false, filter=none, ops=all
  // =

  changes = await dpackapi.diff(srcVault, '/subdir', dstVault, '/')
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'add', type: 'file', path: '/foo.txt' }
  ])

  // diff root against nonexistent empty subdir, shallow=false, filter=none, ops=all
  // =

  await t.throws(dpackapi.diff(srcVault, '/', dstVault, '/subdir'))
})

test('diff against populated', async t => {
  var changes

  const srcVault = await tutil.createVault([
    'foo.txt',
    { name: 'bar.data', content: Buffer.from([0x00, 0x01]) },
    'subdir/',
    'subdir/foo.txt',
    { name: 'subdir/bar.data', content: Buffer.from([0x00, 0x01]) }
  ])

  const dstVault = await tutil.createVault([
    {name: 'foo.txt', content: 'asdf'},
    'bar.data/',
    'subdir/',
    'subdir/foo.txt/',
    'subdir/bar.data/',
    'subdir/bar.data/hi',
    'otherfile.txt'
  ])

  await new Promise(resolve => srcVault.ready(resolve))
  await new Promise(resolve => dstVault.ready(resolve))

  // diff root against populated root, shallow=false, filter=none, ops=all
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/')
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'del', type: 'file', path: '/otherfile.txt' },
    { change: 'mod', type: 'file', path: '/foo.txt' },
    { change: 'del', type: 'dir', path: '/bar.data' },
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'del', type: 'dir', path: '/subdir/foo.txt' },
    { change: 'del', type: 'file', path: '/subdir/bar.data/hi' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' },
    { change: 'del', type: 'dir', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' }
  ])

  // diff root against populated root, shallow=true, filter=none, ops=all
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/', {shallow: true})
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'del', type: 'file', path: '/otherfile.txt' },
    { change: 'mod', type: 'file', path: '/foo.txt' },
    { change: 'del', type: 'dir', path: '/bar.data' },
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'del', type: 'dir', path: '/subdir/foo.txt' },
    { change: 'del', type: 'dir', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' }
  ])

  // diff root against populated root, shallow=false, filter=yes, ops=all
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/', {paths: ['/foo.txt', '/subdir']})
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'mod', type: 'file', path: '/foo.txt' },
    { change: 'del', type: 'dir', path: '/subdir/foo.txt' },
    { change: 'del', type: 'file', path: '/subdir/bar.data/hi' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' },
    { change: 'del', type: 'dir', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' }
  ])

  // diff root against populated root, shallow=false, filter=none, ops=mod
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/', {ops: ['mod']})
  t.deepEqual(changes.map(massageDiffObj), [ { change: 'mod', type: 'file', path: '/foo.txt' } ])

  // diff subdir against populated root, shallow=false, filter=none, ops=all
  // =

  changes = await dpackapi.diff(srcVault, '/subdir', dstVault, '/')
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'del', type: 'file', path: '/otherfile.txt' },
    { change: 'mod', type: 'file', path: '/foo.txt' },
    { change: 'del', type: 'dir', path: '/bar.data' },
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'del', type: 'dir', path: '/subdir/foo.txt' },
    { change: 'del', type: 'file', path: '/subdir/bar.data/hi' },
    { change: 'del', type: 'dir', path: '/subdir/bar.data' },
    { change: 'del', type: 'dir', path: '/subdir' }
  ])

  // diff root against populated subdir, shallow=false, filter=none, ops=all
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/subdir')
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'add', type: 'dir', path: '/subdir' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' },
    { change: 'del', type: 'dir', path: '/foo.txt' },
    { change: 'del', type: 'file', path: '/bar.data/hi' },
    { change: 'add', type: 'file', path: '/foo.txt' },
    { change: 'del', type: 'dir', path: '/bar.data' },
    { change: 'add', type: 'file', path: '/bar.data' }
  ])
})

test('diff always ignores dpack.json', async t => {
  var changes

  const srcVault = await tutil.createVault([
    'dpack.json',
    'foo.txt',
    { name: 'bar.data', content: Buffer.from([0x00, 0x01]) },
    'subdir/',
    'subdir/foo.txt',
    { name: 'subdir/bar.data', content: Buffer.from([0x00, 0x01]) }
  ])
  const dstVault = await tutil.createVault()

  await new Promise(resolve => srcVault.ready(resolve))
  await new Promise(resolve => dstVault.ready(resolve))

  // no paths filter
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/')
  t.deepEqual(changes.map(massageDiffObj), [
    // NOTE: no dpack.json
    { change: 'add', type: 'file', path: '/foo.txt' },
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'add', type: 'dir', path: '/subdir' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' }
  ])

  // with paths filter
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/', {paths: ['/foo.txt', '/subdir']})
  t.deepEqual(changes.map(massageDiffObj), [
    // NOTE: no dpack.json
    { change: 'add', type: 'file', path: '/foo.txt' },
    { change: 'add', type: 'dir', path: '/subdir' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' }
  ])

  // with paths filter that tries to include dpack.json
  // =

  changes = await dpackapi.diff(srcVault, '/', dstVault, '/', {paths: ['/dpack.json', '/foo.txt', '/subdir']})
  t.deepEqual(changes.map(massageDiffObj), [
    // NOTE: no dpack.json
    { change: 'add', type: 'file', path: '/foo.txt' },
    { change: 'add', type: 'dir', path: '/subdir' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' }
  ])
})

test('merge into empty', async t => {
  var changes

  const srcVault = await tutil.createVault([
    'foo.txt',
    { name: 'bar.data', content: Buffer.from([0x00, 0x01]) },
    'subdir/',
    'subdir/foo.txt',
    { name: 'subdir/bar.data', content: Buffer.from([0x00, 0x01]) }
  ])
  const dstVault = await tutil.createVault()

  await new Promise(resolve => srcVault.ready(resolve))
  await new Promise(resolve => dstVault.ready(resolve))

  changes = await dpackapi.merge(srcVault, '/', dstVault, '/')
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'add', type: 'file', path: '/foo.txt' },
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'add', type: 'dir', path: '/subdir' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' }
  ])

  t.deepEqual((await dpackapi.readdir(dstVault, '/')).sort(), ['bar.data', 'foo.txt', 'subdir'])
  t.deepEqual((await dpackapi.readdir(dstVault, '/subdir')).sort(), ['bar.data', 'foo.txt'])
})

test('merge into populated', async t => {
  var changes

  const srcVault = await tutil.createVault([
    'foo.txt',
    { name: 'bar.data', content: Buffer.from([0x00, 0x01]) },
    'subdir/',
    'subdir/foo.txt',
    { name: 'subdir/bar.data', content: Buffer.from([0x00, 0x01]) }
  ])

  const dstVault = await tutil.createVault([
    {name: 'foo.txt', content: 'asdf'},
    'bar.data/',
    'subdir/',
    'subdir/foo.txt/',
    'subdir/bar.data/',
    'subdir/bar.data/hi',
    'otherfile.txt'
  ])

  await new Promise(resolve => srcVault.ready(resolve))
  await new Promise(resolve => dstVault.ready(resolve))

  changes = await dpackapi.merge(srcVault, '/', dstVault, '/')
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'del', type: 'file', path: '/otherfile.txt' },
    { change: 'mod', type: 'file', path: '/foo.txt' },
    { change: 'del', type: 'dir', path: '/bar.data' },
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'del', type: 'dir', path: '/subdir/foo.txt' },
    { change: 'del', type: 'file', path: '/subdir/bar.data/hi' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' },
    { change: 'del', type: 'dir', path: '/subdir/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' }
  ])

  t.deepEqual((await dpackapi.readdir(dstVault, '/')).sort(), ['bar.data', 'foo.txt', 'subdir'])
  t.deepEqual((await dpackapi.readdir(dstVault, '/subdir')).sort(), ['bar.data', 'foo.txt'])
  t.deepEqual((await dpackapi.stat(dstVault, '/bar.data')).isFile(), true)
})

test('merge into populated (add only)', async t => {
  var changes

  const srcVault = await tutil.createVault([
    'foo.txt',
    { name: 'bar.data', content: Buffer.from([0x00, 0x01]) },
    'subdir/',
    'subdir/foo.txt',
    { name: 'subdir/bar.data', content: Buffer.from([0x00, 0x01]) }
  ])

  const dstVault = await tutil.createVault([
    {name: 'foo.txt', content: 'asdf'},
    'bar.data/',
    'subdir/',
    'subdir/foo.txt/',
    'subdir/bar.data/',
    'subdir/bar.data/hi',
    'otherfile.txt'
  ])

  await new Promise(resolve => srcVault.ready(resolve))
  await new Promise(resolve => dstVault.ready(resolve))

  changes = await dpackapi.merge(srcVault, '/', dstVault, '/', {ops: ['add']})
  t.deepEqual(changes.map(massageDiffObj), [
    { change: 'add', type: 'file', path: '/bar.data' },
    { change: 'add', type: 'file', path: '/subdir/foo.txt' },
    { change: 'add', type: 'file', path: '/subdir/bar.data' }
  ])

  t.deepEqual((await dpackapi.readdir(dstVault, '/')).sort(), ['bar.data', 'foo.txt', 'otherfile.txt', 'subdir'])
  t.deepEqual((await dpackapi.readdir(dstVault, '/subdir')).sort(), ['bar.data', 'foo.txt'])
  t.deepEqual((await dpackapi.stat(dstVault, '/bar.data')).isFile(), true) // add-only still overwrites folders with files
})

function massageDiffObj (d) {
  d.path = tutil.tonix(d.path)
  return d
}
