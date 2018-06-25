const test = require('ava')
const tutil = require('./util')
const dpackapi = require('../index')

test('read/write/update manifest', async t => {
  var vault = await tutil.createVault([])
  await new Promise(resolve => vault.ready(resolve))

  await dpackapi.writeManifest(vault, {
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    title: 'My dPack',
    description: 'This dPack has a manifest!',
    type: 'foo bar',
    links: {repository: 'https://github.com/distributedweb/dpack-api-v2.git'},
    author: {
      name: 'Bob',
      url: 'dweb://ffffffffffffffffffffffffffffffff'
    }
  })

  t.deepEqual(await dpackapi.readManifest(vault), {
    title: 'My dPack',
    description: 'This dPack has a manifest!',
    type: ['foo', 'bar'],
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    author: {
      name: 'Bob',
      url: 'dweb://ffffffffffffffffffffffffffffffff'
    }
  })

  await dpackapi.updateManifest(vault, {
    title: 'My dPack!!',
    type: 'foo'
  })

  t.deepEqual(await dpackapi.readManifest(vault), {
    title: 'My dPack!!',
    description: 'This dPack has a manifest!',
    type: ['foo'],
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    author: {
      name: 'Bob',
      url: 'dweb://ffffffffffffffffffffffffffffffff'
    }
  })

  await dpackapi.updateManifest(vault, {
    author: 'Robert'
  })

  t.deepEqual(await dpackapi.readManifest(vault), {
    title: 'My dPack!!',
    description: 'This dPack has a manifest!',
    type: ['foo'],
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    author: {
      name: 'Robert'
    }
  })

  await dpackapi.updateManifest(vault, {
    author: 'dweb://ffffffffffffffffffffffffffffffff'
  })

  t.deepEqual(await dpackapi.readManifest(vault), {
    title: 'My dPack!!',
    description: 'This dPack has a manifest!',
    type: ['foo'],
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    author: {
      url: 'dweb://ffffffffffffffffffffffffffffffff'
    }
  })

  // should ignore bad well-known values
  // but leave others alone
  await dpackapi.updateManifest(vault, {
    author: true,
    foobar: true
  })

  t.deepEqual(await dpackapi.readManifest(vault), {
    title: 'My dPack!!',
    description: 'This dPack has a manifest!',
    type: ['foo'],
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    author: {
      url: 'dweb://ffffffffffffffffffffffffffffffff'
    },
    foobar: true
  })
})

test('read/write/update manifest w/fs', async t => {
  var fs = await tutil.createFs([])

  await dpackapi.writeManifest(fs, {
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    title: 'My dPack',
    description: 'This dPack has a manifest!',
    type: 'foo bar',
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    author: {
      name: 'Bob',
      url: 'dweb://ffffffffffffffffffffffffffffffff'
    }
  })

  t.deepEqual(await dpackapi.readManifest(fs), {
    title: 'My dPack',
    description: 'This dPack has a manifest!',
    type: ['foo', 'bar'],
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    author: {
      name: 'Bob',
      url: 'dweb://ffffffffffffffffffffffffffffffff'
    }
  })

  await dpackapi.updateManifest(fs, {
    title: 'My dPack!!',
    type: 'foo'
  })

  t.deepEqual(await dpackapi.readManifest(fs), {
    title: 'My dPack!!',
    description: 'This dPack has a manifest!',
    type: ['foo'],
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    author: {
      name: 'Bob',
      url: 'dweb://ffffffffffffffffffffffffffffffff'
    }
  })

  await dpackapi.updateManifest(fs, {
    author: 'Robert'
  })

  t.deepEqual(await dpackapi.readManifest(fs), {
    title: 'My dPack!!',
    description: 'This dPack has a manifest!',
    type: ['foo'],
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    author: {
      name: 'Robert'
    }
  })

  await dpackapi.updateManifest(fs, {
    author: 'dweb://ffffffffffffffffffffffffffffffff'
  })

  t.deepEqual(await dpackapi.readManifest(fs), {
    title: 'My dPack!!',
    description: 'This dPack has a manifest!',
    type: ['foo'],
    links: {repository: [{href: 'https://github.com/distributedweb/dpack-api-v2.git'}]},
    url: `dweb://${tutil.FAKE_DPACK_KEY}`,
    author: {
      url: 'dweb://ffffffffffffffffffffffffffffffff'
    }
  })
})
