const test = require('ava')
const fs = require('fs')
const path = require('path')
const tutil = require('./util')
const dpackapi = require('../index')

test('exportFilesystemToVault', async t => {
  const srcPath = tutil.tmpdir()
  fs.writeFileSync(path.join(srcPath, 'foo.txt'), 'content')
  fs.writeFileSync(path.join(srcPath, 'bar.data'), Buffer.from([0x00, 0x01]))
  fs.mkdirSync(path.join(srcPath, 'subdir'))
  fs.writeFileSync(path.join(srcPath, 'subdir', 'foo.txt'), 'content')
  fs.writeFileSync(path.join(srcPath, 'subdir', 'bar.data'), Buffer.from([0x00, 0x01]))

  const dstVault = await tutil.createVault()
  await new Promise(resolve => dstVault.ready(resolve))

  // initial import
  // =

  const statsA = await dpackapi.exportFilesystemToVault({
    srcPath,
    dstVault,
    inplaceImport: true
  })
  var expectedAddedA = ['/foo.txt', '/bar.data', '/subdir/foo.txt', '/subdir/bar.data']
  statsA.addedFiles.sort(); expectedAddedA.sort()
  t.deepEqual(statsA.addedFiles.map(tutil.tonix), expectedAddedA)
  t.deepEqual(statsA.updatedFiles, [])
  t.deepEqual(statsA.skipCount, 0)
  t.deepEqual(statsA.fileCount, 4)

  // no changes
  // =

  const statsB = await dpackapi.exportFilesystemToVault({
    srcPath,
    dstVault,
    inplaceImport: true
  })
  var expectedUpdatedB = ['/bar.data', '/foo.txt', '/subdir/bar.data', '/subdir/foo.txt']
  t.deepEqual(statsB.addedFiles, [])
  t.deepEqual(statsB.updatedFiles.map(tutil.tonix), expectedUpdatedB)
  t.deepEqual(statsB.skipCount, 0)
  t.deepEqual(statsB.fileCount, 4)

  // make changes
  // =

  fs.writeFileSync(path.join(srcPath, 'foo.txt'), 'new content')
  fs.writeFileSync(path.join(srcPath, 'subdir', 'bar.data'), Buffer.from([0x01, 0x02, 0x03, 0x04]))
  fs.mkdirSync(path.join(srcPath, 'subdir2'))
  fs.writeFileSync(path.join(srcPath, 'subdir2', 'foo.txt'), 'content')

  // 2 changes, 2 additions
  // =

  const statsD = await dpackapi.exportFilesystemToVault({
    srcPath,
    dstVault,
    inplaceImport: true
  })
  var expectedAddedD = ['/subdir2/foo.txt']
  statsD.addedFiles.sort(); expectedAddedD.sort()
  t.deepEqual(statsD.addedFiles.map(tutil.tonix), expectedAddedD)
  var expectedUpdatedD = ['/bar.data', '/foo.txt', '/subdir/bar.data', '/subdir/foo.txt']
  statsD.updatedFiles.sort(); expectedUpdatedD.sort()
  t.deepEqual(statsD.updatedFiles.map(tutil.tonix), expectedUpdatedD)
  t.deepEqual(statsD.skipCount, 0)
  t.deepEqual(statsD.fileCount, 5)

  // into subdir
  // =

  const statsE = await dpackapi.exportFilesystemToVault({
    srcPath,
    dstVault,
    dstPath: '/subdir3',
    inplaceImport: true
  })
  var expectedAddedE = ['/subdir3/foo.txt', '/subdir3/bar.data', '/subdir3/subdir/foo.txt', '/subdir3/subdir/bar.data', '/subdir3/subdir2/foo.txt']
  statsE.addedFiles = statsE.addedFiles.map(tutil.tonix)
  statsE.addedFiles.sort(); expectedAddedE.sort()
  t.deepEqual(statsE.addedFiles, expectedAddedE)
  t.deepEqual(statsE.updatedFiles, [])
  t.deepEqual(statsE.skipCount, 0)
  t.deepEqual(statsE.fileCount, 5)

  // dont overwrite folders with files
  // =

  await dpackapi.mkdir(dstVault, '/subdir4')
  const statsF = await dpackapi.exportFilesystemToVault({
    srcPath: path.join(srcPath, 'foo.txt'),
    dstVault,
    dstPath: '/subdir4',
    inplaceImport: true
  })
  t.deepEqual(statsF.addedFiles.map(tutil.tonix), ['/subdir4/foo.txt'])
  t.deepEqual(statsF.updatedFiles, [])
  t.deepEqual(statsF.skipCount, 0)
  t.deepEqual(statsF.fileCount, 1)  
  t.deepEqual(await dpackapi.readdir(dstVault, '/subdir4'), ['foo.txt'])

  // into bad dest
  // =

  await t.throws(dpackapi.exportFilesystemToVault({
    srcPath,
    dstVault,
    dstPath: '/bad/subdir',
    inplaceImport: true
  }))
  await t.throws(dpackapi.exportFilesystemToVault({
    srcPath,
    dstVault,
    dstPath: '/bad/subdir'
  }))
  await t.throws(dpackapi.exportFilesystemToVault({
    srcPath,
    dstVault,
    dstPath: '/subdir3/foo.txt',
    inplaceImport: true
  }))
  await t.throws(dpackapi.exportFilesystemToVault({
    srcPath,
    dstVault,
    dstPath: '/subdir3/foo.txt'
  }))
})

test('exportVaultToFilesystem', async t => {
  const srcVault = await tutil.createVault([
    'foo.txt',
    { name: 'bar.data', content: Buffer.from([0x00, 0x01]) },
    'subdir/',
    'subdir/foo.txt',
    { name: 'subdir/bar.data', content: Buffer.from([0x00, 0x01]) }
  ])

  const dstPathA = tutil.tmpdir()
  const dstPathB = tutil.tmpdir()

  // export all
  // =

  const statsA = await dpackapi.exportVaultToFilesystem({
    srcVault,
    dstPath: dstPathA
  })

  const expectedAddedFilesA = ['foo.txt', 'bar.data', 'subdir/foo.txt', 'subdir/bar.data'].map(n => path.join(dstPathA, n))
  statsA.addedFiles.sort(); expectedAddedFilesA.sort()
  t.deepEqual(statsA.addedFiles, expectedAddedFilesA)
  t.deepEqual(statsA.updatedFiles, [])
  t.deepEqual(statsA.fileCount, 4)

  // fail export
  // =

  const errorA = await t.throws(dpackapi.exportVaultToFilesystem({
    srcVault,
    dstPath: dstPathA
  }))
  t.truthy(errorA.destDirectoryNotEmpty)

  // overwrite all
  // =

  const statsB = await dpackapi.exportVaultToFilesystem({
    srcVault,
    dstPath: dstPathA,
    overwriteExisting: true
  })

  statsB.updatedFiles.sort()
  t.deepEqual(statsB.addedFiles, [])
  t.deepEqual(statsB.updatedFiles, expectedAddedFilesA)
  t.deepEqual(statsB.fileCount, 4)

  // export subdir
  // =

  const statsC = await dpackapi.exportVaultToFilesystem({
    srcVault,
    dstPath: dstPathB,
    srcPath: '/subdir'
  })

  const expectedAddedFilesC = ['foo.txt', 'bar.data'].map(n => path.join(dstPathB, n))
  statsC.addedFiles.sort(); expectedAddedFilesC.sort()
  t.deepEqual(statsC.addedFiles, expectedAddedFilesC)
  t.deepEqual(statsC.updatedFiles, [])
  t.deepEqual(statsC.fileCount, 2)
})

test('exportVaultToVault', async t => {
  const srcVaultA = await tutil.createVault([
    'foo.txt',
    { name: 'bar.data', content: Buffer.from([0x00, 0x01]) },
    'subdir/',
    'subdir/foo.txt',
    { name: 'subdir/bar.data', content: Buffer.from([0x00, 0x01]) }
  ])

  const dstVaultA = await tutil.createVault()
  const dstVaultB = await tutil.createVault()
  const dstVaultC = await tutil.createVault()
  const dstVaultD = await tutil.createVault()
  const dstVaultE = await tutil.createVault([
    {name: 'foo.txt', content: 'asdf'},
    'bar.data/',
    'subdir/',
    'subdir/foo.txt/',
    'subdir/bar.data/',
    'subdir/bar.data/hi',
    'otherfile.txt'
  ])

  await new Promise(resolve => dstVaultA.ready(resolve))
  await new Promise(resolve => dstVaultB.ready(resolve))
  await new Promise(resolve => dstVaultC.ready(resolve))
  await new Promise(resolve => dstVaultD.ready(resolve))
  await new Promise(resolve => dstVaultE.ready(resolve))

  // export all
  // =

  await dpackapi.exportVaultToVault({
    srcVault: srcVaultA,
    dstVault: dstVaultA
  })

  t.deepEqual((await dpackapi.readdir(dstVaultA, '/')).sort(), ['bar.data', 'foo.txt', 'subdir'])
  t.deepEqual((await dpackapi.readdir(dstVaultA, '/subdir')).sort(), ['bar.data', 'foo.txt'])

  // export from subdir
  // =

  await dpackapi.exportVaultToVault({
    srcVault: srcVaultA,
    dstVault: dstVaultB,
    srcPath: '/subdir'
  })

  t.deepEqual((await dpackapi.readdir(dstVaultB, '/')).sort(), ['bar.data', 'foo.txt'])

  // export to subdir
  // =

  await dpackapi.exportVaultToVault({
    srcVault: srcVaultA,
    dstVault: dstVaultC,
    dstPath: '/gpdir'
  })

  t.deepEqual((await dpackapi.readdir(dstVaultC, '/')).sort(), ['gpdir'])
  t.deepEqual((await dpackapi.readdir(dstVaultC, '/gpdir')).sort(), ['bar.data', 'foo.txt', 'subdir'])
  t.deepEqual((await dpackapi.readdir(dstVaultC, '/gpdir/subdir')).sort(), ['bar.data', 'foo.txt'])

  // export from subdir to subdir
  // =

  await dpackapi.exportVaultToVault({
    srcVault: srcVaultA,
    dstVault: dstVaultD,
    srcPath: '/subdir',
    dstPath: '/gpdir'
  })

  t.deepEqual((await dpackapi.readdir(dstVaultD, '/')).sort(), ['gpdir'])
  t.deepEqual((await dpackapi.readdir(dstVaultD, '/gpdir')).sort(), ['bar.data', 'foo.txt'])

  // export all and overwrite target
  // =

  await dpackapi.exportVaultToVault({
    srcVault: srcVaultA,
    dstVault: dstVaultE
  })

  t.deepEqual((await dpackapi.readdir(dstVaultE, '/')).sort(), ['bar.data', 'foo.txt', 'otherfile.txt', 'subdir'])
  t.deepEqual((await dpackapi.readdir(dstVaultE, '/subdir')).sort(), ['bar.data', 'foo.txt'])

  // into bad subdir
  // =

  await t.throws(dpackapi.exportVaultToVault({
    srcVault: srcVaultA,
    dstVault: dstVaultE,
    dstPath: '/bad/subdir'
  }))
  await t.throws(dpackapi.exportVaultToVault({
    srcVault: srcVaultA,
    dstVault: dstVaultE,
    dstPath: '/foo.txt'
  }))
})

