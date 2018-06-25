const assert = require('assert')
const path = require('path')
const fse = require('fs-extra')
const dWebChannel = require('@dwcore/channel')
const match = require('anymatch')
const {
  VaultNotWritableError,
  SourceNotFoundError,
  DestDirectoryNotEmpty,
  ParentFolderDoesntExistError
} = require('@dbrowser/errors')
const {maybe} = require('./common')
const {stat} = require('./lookup')
const {readdir} = require('./read')
const {mkdir} = require('./write')
const {unlink, rmdir} = require('./delete')

const DEFAULT_IGNORE = ['.dpack', '**/.dpack', '.git', '**/.git']

// copy files from the filesystem into an vault
function exportFilesystemToVault (opts, cb) {
  return maybe(cb, async function () {
    assert(opts && typeof opts === 'object', 'opts object is required')

    // core arguments, srcPath and dstVault
    var srcPath = opts.srcPath
    var dstVault = opts.dstVault
    assert(srcPath && typeof srcPath === 'string', 'srcPath is required')
    assert(dstVault && typeof dstVault === 'object', 'dstVault is required')

    // options
    var dstPath = typeof opts.dstPath === 'string' ? opts.dstPath : '/'
    var ignore = Array.isArray(opts.ignore) ? opts.ignore : DEFAULT_IGNORE
    var inplaceImport = opts.inplaceImport === true
    var dryRun = opts.dryRun === true

    // ensure we have the vault's private key
    if (!dstVault.writable && !dryRun) {
      throw new VaultNotWritableError()
    }

    // make source the source exists
    var srcStat
    try {
      srcStat = await fse.stat(srcPath)
    } catch (e) {
      throw new SourceNotFoundError(e.toString())
    }

    // if reading from a directory, and not doing an implace-import,
    // then put the dstPath at a subpath so that the folder's contents dont
    // get imported in-place into the vault
    if (srcStat.isDirectory() && !inplaceImport) {
      dstPath = path.join(dstPath, path.basename(srcPath))
    }

    // make sure the destination is a folder
    var dstStat
    try { dstStat = await stat(dstVault, dstPath) } catch (e) {}
    if (!dstStat) {
      try { dstStat = await stat(dstVault, path.dirname(dstPath)) } catch (e) {}
    }
    if (!dstStat || !dstStat.isDirectory()) {
      throw new ParentFolderDoesntExistError()
    }

    // dont overwrite directories with files
    if (!srcStat.isDirectory() && dstStat.isDirectory()) {
      dstPath = path.join(dstPath, path.basename(srcPath))
    }

    const statThenExport = async function (srcPath, dstPath) {
      // apply ignore filter
      if (ignore && match(ignore, srcPath)) {
        return
      }

      // export by type
      var srcStat = await fse.stat(srcPath)
      if (srcStat.isFile()) {
        await exportFile(srcPath, srcStat, dstPath)
      } else if (srcStat.isDirectory()) {
        await exportDirectory(srcPath, dstPath)
      }
    }

    const exportFile = async function (srcPath, srcStat, dstPath) {
      // fetch dest stats
      var dstFileStats = null
      try {
        dstFileStats = await stat(dstVault, dstPath)
      } catch (e) {}

      // track the stats
      stats.fileCount++
      stats.totalSize += srcStat.size || 0
      if (dstFileStats) {
        if (dstFileStats.isDirectory()) {
          // delete the directory-tree
          await rmdir(dstVault, dstPath, {recursive: true})
          stats.addedFiles.push(dstPath)
        } else {
          stats.updatedFiles.push(dstPath)
        }
      } else {
        stats.addedFiles.push(dstPath)
      }

      // write the file
      return new Promise((resolve, reject) => {
        dWebChannel(
          fse.createReadStream(srcPath),
          dstVault.createWriteStream(dstPath),
          err => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    }

    const exportDirectory = async function (srcPath, dstPath) {
      // make sure the destination folder exists
      var dstStat
      try { dstStat = await stat(dstVault, dstPath) } catch (e) {}
      if (!dstStat) {
        await mkdir(dstVault, dstPath)
      } else if (dstStat.isFile()) {
        await unlink(dstVault, dstPath)
        await mkdir(dstVault, dstPath)
      }

      // list the directory
      var fileNames = await fse.readdir(srcPath)

      // recurse into each
      var promises = fileNames.map(name => {
        return statThenExport(path.join(srcPath, name), path.join(dstPath, name))
      })
      await Promise.all(promises)
    }

    // recursively export
    var stats = { addedFiles: [], updatedFiles: [], skipCount: 0, fileCount: 0, totalSize: 0 }
    await statThenExport(srcPath, dstPath)
    return stats
  })
}

// copy files from an vault into the filesystem
function exportVaultToFilesystem (opts, cb) {
  return maybe(cb, async function () {
    assert(opts && typeof opts === 'object', 'opts object is required')

    // core arguments, dstPath and srcVault
    var srcVault = opts.srcVault
    var dstPath = opts.dstPath
    assert(srcVault && typeof srcVault === 'object', 'srcVault is required')
    assert(dstPath && typeof dstPath === 'string', 'dstPath is required')

    // options
    var srcPath = typeof opts.srcPath === 'string' ? opts.srcPath : '/'
    var overwriteExisting = opts.overwriteExisting === true
    var skipUndownloadedFiles = opts.skipUndownloadedFiles === true
    var ignore = Array.isArray(opts.ignore) ? opts.ignore : DEFAULT_IGNORE

    // abort if nonempty and not overwriting existing
    if (!overwriteExisting) {
      let files
      try {
        files = await fse.readdir(dstPath)
      } catch (e) {
        // target probably doesnt exist, continue and let ensureDirectory handle it
      }
      if (files && files.length > 0) {
        throw new DestDirectoryNotEmpty()
      }
    }

    const statThenExport = async function (srcPath, dstPath) {
      // apply ignore filter
      if (ignore && match(ignore, srcPath)) {
        return
      }

      // export by type
      var srcStat = await stat(srcVault, srcPath)
      if (srcStat.isFile()) {
        await exportFile(srcPath, srcStat, dstPath)
      } else if (srcStat.isDirectory()) {
        await exportDirectory(srcPath, dstPath)
      }
    }

    const exportFile = async function (srcPath, srcStat, dstPath) {
      // skip undownloaded files
      if (skipUndownloadedFiles && srcStat.downloaded < srcStat.blocks) {
        return
      }

      // fetch dest stats
      var dstFileStats = null
      try {
        dstFileStats = await fse.stat(dstPath)
      } catch (e) {}

      // track the stats
      stats.fileCount++
      stats.totalSize += srcStat.size || 0
      if (dstFileStats) {
        if (dstFileStats.isDirectory()) {
          // delete the directory-tree
          await fse.remove(dstPath)
          stats.addedFiles.push(dstPath)
        } else {
          stats.updatedFiles.push(dstPath)
        }
      } else {
        stats.addedFiles.push(dstPath)
      }

      // write the file
      return new Promise((resolve, reject) => {
        dWebChannel(
          srcVault.createReadStream(srcPath),
          fse.createWriteStream(dstPath),
          err => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    }

    const exportDirectory = async function (srcPath, dstPath) {
      // make sure the destination folder exists
      await fse.ensureDir(dstPath)

      // list the directory
      var fileNames = await readdir(srcVault, srcPath)

      // recurse into each
      var promises = fileNames.map(name => {
        return statThenExport(path.join(srcPath, name), path.join(dstPath, name))
      })
      await Promise.all(promises)
    }

    // recursively export
    var stats = { addedFiles: [], updatedFiles: [], skipCount: 0, fileCount: 0, totalSize: 0 }
    await statThenExport(srcPath, dstPath)
    return stats
  })
}

// copy files from one vault into another
function exportVaultToVault (opts, cb) {
  return maybe(cb, async function () {
    assert(opts && typeof opts === 'object', 'opts object is required')

    // core arguments, dstVault and srcVault
    var srcVault = opts.srcVault
    var dstVault = opts.dstVault
    assert(srcVault && typeof srcVault === 'object', 'srcVault is required')
    assert(dstVault && typeof dstVault === 'object', 'dstVault is required')

    // options
    var srcPath = typeof opts.srcPath === 'string' ? opts.srcPath : '/'
    var dstPath = typeof opts.dstPath === 'string' ? opts.dstPath : '/'
    var skipUndownloadedFiles = opts.skipUndownloadedFiles === true
    var ignore = Array.isArray(opts.ignore) ? opts.ignore : DEFAULT_IGNORE

    // ensure we have the vault's private key
    if (!dstVault.writable) {
      throw new VaultNotWritableError()
    }

    // make sure the destination is a folder
    var dstStat
    try { dstStat = await stat(dstVault, dstPath) } catch (e) {}
    if (!dstStat) {
      try { dstStat = await stat(dstVault, path.dirname(dstPath)) } catch (e) {}
    }
    if (!dstStat || !dstStat.isDirectory()) {
      throw new ParentFolderDoesntExistError()
    }

    const statThenExport = async function (srcPath, dstPath) {
      // apply ignore filter
      if (ignore && match(ignore, srcPath)) {
        return
      }

      // export by type
      var srcStat = await stat(srcVault, srcPath)
      if (srcStat.isFile()) {
        await exportFile(srcPath, srcStat, dstPath)
      } else if (srcStat.isDirectory()) {
        await exportDirectory(srcPath, dstPath)
      }
    }

    const exportFile = async function (srcPath, srcStat, dstPath) {
      // skip undownloaded files
      if (skipUndownloadedFiles && srcStat.downloaded < srcStat.blocks) {
        return
      }

      // fetch dest stats
      var dstFileStats = null
      try {
        dstFileStats = await stat(dstVault, dstPath)
      } catch (e) {}

      // track the stats
      stats.fileCount++
      stats.totalSize += srcStat.size || 0
      if (dstFileStats) {
        if (dstFileStats.isDirectory()) {
          // delete the directory-tree
          await rmdir(dstVault, dstPath, {recursive: true})
          stats.addedFiles.push(dstPath)
        } else {
          stats.updatedFiles.push(dstPath)
        }
      } else {
        stats.addedFiles.push(dstPath)
      }

      // write the file
      return new Promise((resolve, reject) => {
        dWebChannel(
          srcVault.createReadStream(srcPath),
          dstVault.createWriteStream(dstPath),
          err => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    }

    const exportDirectory = async function (srcPath, dstPath) {
      // make sure the destination folder exists
      var dstStat
      try { dstStat = await stat(dstVault, dstPath) } catch (e) {}
      if (!dstStat) {
        await mkdir(dstVault, dstPath)
      } else if (dstStat.isFile()) {
        await unlink(dstVault, dstPath)
        await mkdir(dstVault, dstPath)
      }

      // list the directory
      var fileNames = await readdir(srcVault, srcPath)

      // recurse into each
      var promises = fileNames.map(name => {
        return statThenExport(path.join(srcPath, name), path.join(dstPath, name))
      })
      await Promise.all(promises)
    }

    // recursively export
    var stats = { addedFiles: [], updatedFiles: [], skipCount: 0, fileCount: 0, totalSize: 0 }
    await statThenExport(srcPath, dstPath)
    return stats
  })
}

module.exports = {exportFilesystemToVault, exportVaultToFilesystem, exportVaultToVault}
