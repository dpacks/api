const path = require('path')
const {NotAFileError} = require('@dbrowser/errors')
const {maybe, toDBrowserError, toValidEncoding} = require('./common')
const {stat} = require('./lookup')

// helper to pull file data from an vault
function readFile (vault, name, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  return maybe(cb, async function () {
    opts = opts || {}
    if (typeof opts === 'string') {
      opts = { encoding: opts }
    }
    opts.encoding = toValidEncoding(opts.encoding)

    // check that it's a file
    const st = await stat(vault, name)
    if (!st.isFile()) {
      throw new NotAFileError()
    }

    // read the file
    return new Promise((resolve, reject) => {
      vault.readFile(name, opts, (err, data) => {
        if (err) reject(toDBrowserError(err, 'readFile'))
        else resolve(data)
      })
    })
  })
}

// helper to list the files in a directory
function readdir (vault, name, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  opts = opts || {}

  return maybe(cb, async function () {
    // options
    var recursive = (opts && !!opts.recursive)

    // run first readdir
    var promise = new Promise((resolve, reject) => {
      vault.readdir(name, (err, names) => {
        if (err) reject(toDBrowserError(err, 'readdir'))
        else resolve(names)
      })
    })
    var results = await promise

    // recurse if requested
    if (recursive) {
      var rootPath = name
      const readdirSafe = name => new Promise(resolve => {
        vault.readdir(name, (_, names) => resolve(names || []))
      })
      const recurse = async function (names, parentPath) {
        await Promise.all(names.map(async function (name) {
          var thisPath = path.join(parentPath, name)
          var subnames = await readdirSafe(thisPath)
          await recurse(subnames, thisPath)
          results = results.concat(subnames.map(subname => normalize(rootPath, thisPath, subname)))
        }))
      }
      await recurse(results, name)
    }
    return results
  })
}

function readSize (vault, name, cb) {
  return maybe(cb, async function () {
    // stat the target
    const st = await stat(vault, name)

    // leaf
    if (st.isFile()) {
      return st.size
    }

    // list files
    const children = await readdir(vault, name)

    // recurse
    var size = 0
    for (let i = 0; i < children.length; i++) {
      size += await readSize(vault, path.join(name, children[i]))
    }
    return size
  })
}

function normalize (rootPath, parentPath, subname) {
  var str = path.join(parentPath, subname).slice(rootPath.length)
  if (str.charAt(0) === '/') return str.slice(1)
  return str
}

module.exports = {readFile, readdir, readSize}
