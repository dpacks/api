const path = require('path')
const {maybe, toDBrowserError} = require('./common')
const {
  NotFoundError,
  NotAFileError,
  NotAFolderError,
  DestDirectoryNotEmpty,
  VaultNotWritableError
} = require('@dbrowser/errors')
const {stat} = require('./lookup')
const {readdir} = require('./read')

function unlink (vault, name, cb) {
  return maybe(cb, async function () {
    // ensure we have the vault's private key
    if (vault.key && !vault.writable) {
      throw new VaultNotWritableError()
    }

    // ensure the target location is a file
    var st
    try { st = await stat(vault, name) } catch (e) {}
    if (!st) {
      throw new NotFoundError()
    }
    if (!st.isFile()) {
      throw new NotAFileError('Cannot unlink non-files')
    }

    // write
    return new Promise((resolve, reject) => {
      vault.unlink(name, err => {
        if (err) reject(toDBrowserError(err, 'unlink'))
        else resolve()
      })
    })
  })
}

function rmdir (vault, name, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  return maybe(cb, async function () {
    opts = opts || {}
    var recursive = opts && opts.recursive

    // ensure we have the vault's private key
    if (vault.key && !vault.writable) {
      throw new VaultNotWritableError()
    }

    // ensure the target location is a folder
    var st
    try { st = await stat(vault, name) } catch (e) {}
    if (!st) {
      throw new NotFoundError()
    }
    if (!st.isDirectory()) {
      throw new NotAFolderError('Cannot rmdir non-folders')
    }

    if (recursive) {
      // TODO
      // fetch and delete all children
      // var release = await lock(vault)
      try {
        return recurseDelete(vault, name, st)
      } finally {
        // release()
      }
    } else {
      // delete if there are no children
      var children = await readdir(vault, name)
      if (children.length) {
        throw new DestDirectoryNotEmpty()
      }
      return new Promise((resolve, reject) => {
        vault.rmdir(name, err => {
          if (err) reject(toDBrowserError(err, 'rmdir'))
          else resolve()
        })
      })
    }
  })
}

async function recurseDelete (vault, targetPath, st) {

  // fetch stat if needed
  if (!st) {
    st = await stat(vault, targetPath)
  }
  if (st.isFile()) {
    // delete file
    return new Promise((resolve, reject) => {
      vault.unlink(targetPath, (err) => {
        if (err) reject(toDBrowserError(err, 'unlink'))
        else resolve()
      })
    })
  } else if (st.isDirectory()) {
    // fetch children
    var children = await readdir(vault, targetPath)
    // delete children
    for (var i = 0; i < children.length; i++) {
      await recurseDelete(vault, path.join(targetPath, children[i]))
    }
    // delete self
    return new Promise((resolve, reject) => {
      vault.rmdir(targetPath, err => {
        // FIXME
        // there's a ddrive bug that causes empty dirs to register as NotFound
        // https://github.com/distributedweb/append-tree/issues/6
        // if (err) reject(toDBrowserError(err, 'rmdir'))
        // else resolve()
        if (err) {
          console.warn('rmdir issue (append-tree#6)', err)
        }
        resolve()
      })
    })
  } else {
    throw new Error('Unexpectedly encountered an entry which is neither a file or directory at', path)
  }
}

module.exports = {unlink, rmdir}
