const test = require('ava')
const ddrive = require('@ddrive/core')
const tutil = require('./util')
const dpackapi = require('../index')

async function contentEvent (vault) {
  return new Promise(resolve => {
    vault.on('content', resolve)
  })
}

test('watch fs', async t => {
  // HACK
  // 100ms timeouts are needed here because the FS watcher is not as consistent as dPack's
  // -prf

  var fs
  var changes
  var stream
  var done

  // no pattern
  // =

  fs = await tutil.createFs()
  stream = await dpackapi.watch(fs)

  done = new Promise(resolve => {
    changes = ['/a.txt', '/b.txt', '/a.txt', '/a.txt', '/b.txt', '/c.txt']
    let i = 0
    stream.on('data', ([event, args]) => {
      if (process.platform === 'win32' && (++i) % 2 === 0) {
        // HACK win32 emits 2 events for some stupid reason, skip one
        return
      }
      t.deepEqual(event, 'changed')
      t.deepEqual(args.path, changes.shift())
      if (changes.length === 0) resolve()
    })
  })

  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/b.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'two', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/b.txt', 'two', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/c.txt', 'one', 'utf8')
  await done

  // simple pattern
  // =

  fs = await tutil.createFs()
  stream = await dpackapi.watch(fs, '/a.txt')

  done = new Promise(resolve => {
    changes = ['/a.txt', '/a.txt', '/a.txt']
    let i = 0
    stream.on('data', ([event, args]) => {
      if (process.platform === 'win32' && (++i) % 2 === 0) {
        // HACK win32 emits 2 events for some stupid reason, skip one
        return
      }
      t.deepEqual(event, 'changed')
      t.deepEqual(args.path, changes.shift())
      if (changes.length === 0) resolve()
    })
  })

  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/b.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'two', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/b.txt', 'two', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/c.txt', 'one', 'utf8')
  await done

  // complex pattern
  // =

  fs = await tutil.createFs()
  stream = await dpackapi.watch(fs, ['/a.txt', '/c.txt'])

  done = new Promise(resolve => {
    let i = 0
    changes = ['/a.txt', '/a.txt', '/a.txt', '/c.txt']
    stream.on('data', ([event, args]) => {
      if (process.platform === 'win32' && (++i) % 2 === 0) {
        // HACK win32 emits 2 events for some stupid reason, skip one
        return
      }
      t.deepEqual(event, 'changed')
      t.deepEqual(args.path, changes.shift())
      if (changes.length === 0) resolve()
    })
  })

  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/b.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'two', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/b.txt', 'two', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/c.txt', 'one', 'utf8')
  await done

  // glob
  // =

  fs = await tutil.createFs()
  stream = await dpackapi.watch(fs, '/*.txt')

  done = new Promise(resolve => {
    let i = 0
    changes = ['/a.txt', '/b.txt', '/a.txt', '/a.txt', '/b.txt', '/c.txt']
    stream.on('data', ([event, args]) => {
      if (process.platform === 'win32' && (++i) % 2 === 0) {
        // HACK win32 emits 2 events for some stupid reason, skip one
        return
      }
      t.deepEqual(event, 'changed')
      t.deepEqual(args.path, changes.shift())
      if (changes.length === 0) resolve()
    })
  })

  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/b.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'one', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/a.txt', 'two', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/b.txt', 'two', 'utf8')
  await new Promise(r => setTimeout(r, 100))
  await dpackapi.writeFile(fs, '/c.txt', 'one', 'utf8')
  await done
})

test('watch local', async t => {
  var vault
  var changes
  var stream
  var done

  // no pattern
  // =

  vault = await tutil.createVault()
  await new Promise(resolve => vault.ready(resolve))
  stream = dpackapi.watch(vault)

  done = new Promise(resolve => {
    changes = ['/a.txt', '/b.txt', '/a.txt', '/a.txt', '/b.txt', '/c.txt']
    stream.on('data', ([event, args]) => {
      t.deepEqual(event, 'changed')
      t.deepEqual(args.path, changes.shift())
      if (changes.length === 0) resolve()
    })
  })

  await dpackapi.writeFile(vault, '/a.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/b.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/a.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/a.txt', 'two', 'utf8')
  await dpackapi.writeFile(vault, '/b.txt', 'two', 'utf8')
  await dpackapi.writeFile(vault, '/c.txt', 'one', 'utf8')
  await done

  // simple pattern
  // =

  vault = await tutil.createVault()
  await new Promise(resolve => vault.ready(resolve))
  stream = dpackapi.watch(vault, '/a.txt')

  done = new Promise(resolve => {
    changes = ['/a.txt', '/a.txt', '/a.txt']
    stream.on('data', ([event, args]) => {
      t.deepEqual(event, 'changed')
      t.deepEqual(args.path, changes.shift())
      if (changes.length === 0) resolve()
    })
  })

  await dpackapi.writeFile(vault, '/a.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/b.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/a.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/a.txt', 'two', 'utf8')
  await dpackapi.writeFile(vault, '/b.txt', 'two', 'utf8')
  await dpackapi.writeFile(vault, '/c.txt', 'one', 'utf8')
  await done

  // complex pattern
  // =

  vault = await tutil.createVault()
  await new Promise(resolve => vault.ready(resolve))
  stream = dpackapi.watch(vault, ['/a.txt', '/c.txt'])

  done = new Promise(resolve => {
    changes = ['/a.txt', '/a.txt', '/a.txt', '/c.txt']
    stream.on('data', ([event, args]) => {
      t.deepEqual(event, 'changed')
      t.deepEqual(args.path, changes.shift())
      if (changes.length === 0) resolve()
    })
  })

  await dpackapi.writeFile(vault, '/a.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/b.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/a.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/a.txt', 'two', 'utf8')
  await dpackapi.writeFile(vault, '/b.txt', 'two', 'utf8')
  await dpackapi.writeFile(vault, '/c.txt', 'one', 'utf8')
  await done

  // glob
  // =

  vault = await tutil.createVault()
  await new Promise(resolve => vault.ready(resolve))
  stream = dpackapi.watch(vault, '/*.txt')

  done = new Promise(resolve => {
    changes = ['/a.txt', '/b.txt', '/a.txt', '/a.txt', '/b.txt', '/c.txt']
    stream.on('data', ([event, args]) => {
      t.deepEqual(event, 'changed')
      t.deepEqual(args.path, changes.shift())
      if (changes.length === 0) resolve()
    })
  })

  await dpackapi.writeFile(vault, '/a.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/b.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/a.txt', 'one', 'utf8')
  await dpackapi.writeFile(vault, '/a.txt', 'two', 'utf8')
  await dpackapi.writeFile(vault, '/b.txt', 'two', 'utf8')
  await dpackapi.writeFile(vault, '/c.txt', 'one', 'utf8')
  await done
})

test('watch remote thin', async t => {
  // no pattern
  // =

  var done
  const src = await tutil.createVault()
  await new Promise(resolve => src.ready(resolve))
  const dst = ddrive(tutil.tmpdir(), src.key, {thin: true})
  const srcRS = src.replicate({live: true})
  const dstRS = dst.replicate({live: true})
  srcRS.pipe(dstRS).pipe(srcRS)
  await contentEvent(dst)

  var stream = dpackapi.watch(dst)

  // invalidation phase

  var invalidates = ['/a.txt', '/b.txt', '/a.txt', '/a.txt', '/b.txt', '/c.txt']
  var changes = ['/a.txt', '/c.txt', '/b.txt']
  done = new Promise(resolve => {
    stream.on('data', ([event, args]) => {
      if (event === 'invalidated') {
        t.deepEqual(args.path, invalidates.shift())
      } else if (event === 'changed') {
        t.deepEqual(args.path, changes.shift())
      }
      if (changes.length === 0 && invalidates.length === 0) resolve()
    })
  })

  await dpackapi.writeFile(src, 'a.txt', 'one', 'utf8')
  await dpackapi.writeFile(src, 'b.txt', 'one', 'utf8')
  await dpackapi.writeFile(src, 'a.txt', 'one', 'utf8')
  await dpackapi.writeFile(src, 'a.txt', 'two', 'utf8')
  await dpackapi.writeFile(src, 'b.txt', 'two', 'utf8')
  await dpackapi.writeFile(src, 'c.txt', 'one', 'utf8')

  // wait 100ms to let metadata sync
  await new Promise(resolve => setTimeout(resolve, 100))

  await dpackapi.download(dst, 'a.txt')
  await dpackapi.download(dst, 'c.txt')
  await dpackapi.download(dst, 'b.txt')

  await done
})

test('watch remote non-thin', async t => {
  // no pattern
  // =

  var done
  const src = await tutil.createVault()
  await new Promise(resolve => src.ready(resolve))
  const dst = ddrive(tutil.tmpdir(), src.key, {thin: false})
  const srcRS = src.replicate({live: true})
  const dstRS = dst.replicate({live: true})
  srcRS.pipe(dstRS).pipe(srcRS)
  await contentEvent(dst)

  var stream = dpackapi.watch(dst)

  // invalidation phase

  var done = new Promise(resolve => {
    var invalidates = ['/a.txt', '/b.txt', '/a.txt', '/a.txt', '/b.txt', '/c.txt', '/a.txt']
    var changes = ['/a.txt', '/b.txt', '/c.txt', '/a.txt']
    stream.on('data', ([event, args]) => {
      if (event === 'invalidated') {
        t.deepEqual(args.path, invalidates.shift())
      } else if (event === 'changed') {
        changes.splice(changes.indexOf(args.path), 1)
      }
      if (invalidates.length === 0 && changes.length === 0) {
        resolve()
      }
    })
  })

  await dpackapi.writeFile(src, 'a.txt', 'one', 'utf8')
  await dpackapi.writeFile(src, 'b.txt', 'one', 'utf8')
  await dpackapi.writeFile(src, 'a.txt', 'one', 'utf8')
  await dpackapi.writeFile(src, 'a.txt', 'two', 'utf8')
  await dpackapi.writeFile(src, 'b.txt', 'two', 'utf8')
  await dpackapi.writeFile(src, 'c.txt', 'one', 'utf8')
  await dpackapi.unlink(src, 'a.txt')
  await done
})

test('createNetworkActivityStream', async t => {
  const src = await tutil.createVault([
    'foo.txt',
    { name: 'bar.data', content: Buffer.from([0x00, 0x01]) },
    'bar.txt'
  ])
  const dst = ddrive(tutil.tmpdir(), src.key, {thin: false})

  var done = new Promise(resolve => {
    var stream = dpackapi.createNetworkActivityStream(dst)
    var gotPeer = false
    var stats = {
      metadata: {
        down: 0,
        synced: false
      },
      content: {
        down: 0,
        synced: false
      }
    }
    stream.on('data', ([event, args]) => {
      if (event === 'network-changed') {
        gotPeer = true
      } else if (event === 'download') {
        stats[args.feed].down++
      } else if (event === 'sync') {
        stats[args.feed].synced = true
      }
      if (gotPeer &&
        stats.metadata.down === 4 && stats.metadata.synced &&
        stats.content.down === 3 && stats.content.synced) {
        resolve()
      }
    })
  })

  const srcRS = src.replicate({live: true})
  const dstRS = dst.replicate({live: true})
  srcRS.pipe(dstRS).pipe(srcRS)

  await done
})
