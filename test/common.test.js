const test = require('ava')
const tutil = require('./util')
const dpackapi = require('../index')

test('findEntryByContentBlock', async t => {
  var st
  var vault = await tutil.createVault([
    {name: 'a', content: 'a'},
    'b/',
    {name: 'b/a', content: 'b/a'},
    'b/b/',
    {name: 'b/b/a', content: 'b/b/a'},
    {name: 'b/b/b', content: 'b/b/b'},
    {name: 'b/b/c', content: 'b/b/c'},
    {name: 'b/c', content :'b/c'},
    'c/',
    {name: 'd', content :'d'}
  ])
  await new Promise(resolve => vault.ready(resolve))

  st = await dpackapi.stat(vault, '/a')
  t.deepEqual((await dpackapi.findEntryByContentBlock(vault, st.offset)).name, '/a')
  st = await dpackapi.stat(vault, '/b/a')
  t.deepEqual((await dpackapi.findEntryByContentBlock(vault, st.offset)).name, '/b/a')
  st = await dpackapi.stat(vault, '/b/b/a')
  t.deepEqual((await dpackapi.findEntryByContentBlock(vault, st.offset)).name, '/b/b/a')
  st = await dpackapi.stat(vault, '/b/b/b')
  t.deepEqual((await dpackapi.findEntryByContentBlock(vault, st.offset)).name, '/b/b/b')
  st = await dpackapi.stat(vault, '/b/b/c')
  t.deepEqual((await dpackapi.findEntryByContentBlock(vault, st.offset)).name, '/b/b/c')
  st = await dpackapi.stat(vault, '/b/c')
  t.deepEqual((await dpackapi.findEntryByContentBlock(vault, st.offset)).name, '/b/c')
  st = await dpackapi.stat(vault, '/d')
  t.deepEqual((await dpackapi.findEntryByContentBlock(vault, st.offset)).name, '/d')
})
