const path = require('path')
const dWebChannel = require('@dwcore/channel')
const {maybe, toDBrowserError, toValidEncoding} = require('./common')
const {VALID_PATH_REGEX} = require('./const')
const {
  InvalidEncodingError,
  InvalidPathError,
  VaultNotWritableError,
  EntryAlreadyExistsError,
  ParentFolderDoesntExistError
} = require('@dbrowser/errors')
const {stat} = require('./lookup')
const {readdir} = require('./read')
const {unlink, rmdir} = require('./delete')

function writeFile (vault, name, data, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  return maybe(cb, async function () {
    if (typeof opts === 'string') {
      opts = { encoding: opts }
    }
    opts = opts || {}

    // ensure we have the vault's private key
    if (vault.key && !vault.writable) {
      throw new VaultNotWritableError()
    }

    // ensure the target path is valid
    if (name.slice(-1) === '/') {
      throw new InvalidPathError('Files can not have a trailing slash')
    }
    if (!VALID_PATH_REGEX.test(name)) {
      throw new InvalidPathError('Path contains invalid characters')
    }

    // ensure the target location is writable
    var existingEntry
    try { existingEntry = await stat(vault, name) } catch (e) {}
    if (existingEntry && !existingEntry.isFile()) {
      throw new EntryAlreadyExistsError('Cannot overwrite non-files')
    }

    // copy ctime from the existing entry
    if (existingEntry) {
      opts.ctime = existingEntry.ctime
    }

    // ensure that the parent directory exists
    var parentName = path.dirname(name)
    if (parentName !== '/' && parentName !== '.') {
      var parentEntry
      try { parentEntry = await stat(vault, parentName) } catch (e) {}
      if (!parentEntry || !parentEntry.isDirectory()) {
        throw new ParentFolderDoesntExistError()
      }
    }

    // guess the encoding by the data type
    if (!opts.encoding) {
      opts.encoding = (typeof data === 'string' ? 'utf8' : 'binary')
    }
    opts.encoding = toValidEncoding(opts.encoding)

    // validate the encoding
    if (typeof data === 'string' && !opts.encoding) {
      throw new InvalidEncodingError()
    }
    if (typeof data !== 'string' && opts.encoding) {
      throw new InvalidEncodingError()
    }

    // write
    return new Promise((resolve, reject) => {
      vault.writeFile(name, data, opts, err => {
        if (err) reject(toDBrowserError(err, 'writeFile'))
        else resolve()
      })
    })
  })
}

function mkdir (vault, name, cb) {
  return maybe(cb, async function () {
    // ensure we have the vault's private key
    if (vault.key && !vault.writable) {
      throw new VaultNotWritableError()
    }

    // ensure the target path is valid
    if (!VALID_PATH_REGEX.test(name)) {
      throw new InvalidPathError('Path contains invalid characters')
    }

    // ensure the target location is writable
    var existingEntry
    try { existingEntry = await stat(vault, name) } catch (e) {}
    if (name === '/' || existingEntry) {
      throw new EntryAlreadyExistsError('Cannot overwrite files or folders')
    }

    // ensure that the parent directory exists
    var parentName = path.dirname(name)
    if (parentName !== '/' && parentName !== '.') {
      var parentEntry
      try { parentEntry = await stat(vault, parentName) } catch (e) {}
      if (!parentEntry || !parentEntry.isDirectory()) {
        throw new ParentFolderDoesntExistError()
      }
    }

    return new Promise((resolve, reject) => {
      vault.mkdir(name, err => {
        if (err) reject(toDBrowserError(err, 'mkdir'))
        else resolve()
      })
    })
  })
}

function copy (vault, oldName, newName, cb) {
  return maybe(cb, async function () {
    // ensure we have the vault's private key
    if (vault.key && !vault.writable) {
      throw new VaultNotWritableError()
    }

    // ensure the target path is valid
    if (!VALID_PATH_REGEX.test(newName)) {
      throw new InvalidPathError('Path contains invalid characters')
    }

    // ensure that the parent directory exists
    var parentName = path.dirname(newName)
    if (parentName !== '/' && parentName !== '.') {
      var parentEntry
      try { parentEntry = await stat(vault, parentName) } catch (e) {}
      if (!parentEntry || !parentEntry.isDirectory()) {
        throw new ParentFolderDoesntExistError()
      }
    }

    // do copy
    await recurseCopy(vault, oldName, newName)
  })
}

function rename (vault, oldName, newName, cb) {
  return maybe(cb, async function () {
    // ensure the target location is writable
    var existingEntry
    try { existingEntry = await stat(vault, newName) } catch (e) {}
    if (newName === '/' || existingEntry) {
      throw new EntryAlreadyExistsError('Cannot overwrite files or folders')
    }

    // copy the files over
    await copy(vault, oldName, newName)

    // delete the old files
    var st = await stat(vault, oldName)
    if (st.isDirectory()) {
      await rmdir(vault, oldName, {recursive: true})
    } else {
      await unlink(vault, oldName)
    }
  })
}

module.exports = {writeFile, mkdir, copy, rename}

// helpers
// =

function safeStat (vault, path) {
  return stat(vault, path).catch(_ => undefined)
}

async function recurseCopy (vault, sourcePath, targetPath) {
  // fetch stats
  var [sourceStat, targetStat] = await Promise.all([
    stat(vault, sourcePath),
    safeStat(vault, targetPath)
  ])

  if (targetStat) {
    if (sourceStat.isFile() && !targetStat.isFile()) {
      // never allow this
      throw new EntryAlreadyExistsError(`Cannot copy a file onto a folder (${targetPath})`)
    }
    if (!sourceStat.isFile() && targetStat.isFile()) {
      // never allow this
      throw new EntryAlreadyExistsError(`Cannot copy a folder onto a file (${targetPath})`)
    }
  } else {
    if (sourceStat.isDirectory()) {
      // make directory
      await mkdir(vault, targetPath)
    }
  }

  if (sourceStat.isFile()) {
    // copy file
    return new Promise((resolve, reject) => {
      dWebChannel(
        vault.createReadStream(sourcePath),
        vault.createWriteStream(targetPath),
        err => {
          if (err) reject(toDBrowserError(err, 'createReadStream/createWriteStream'))
          else resolve()
        }
      )
    })
  } else if (sourceStat.isDirectory()) {
    // copy children
    var children = await readdir(vault, sourcePath)
    for (var i = 0; i < children.length; i++) {
      await recurseCopy(
        vault,
        path.join(sourcePath, children[i]),
        path.join(targetPath, children[i])
      )
    }
  } else {
    throw new Error('Unexpectedly encountered an entry which is neither a file or directory at', path)
  }
}
