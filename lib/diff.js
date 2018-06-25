const dft = require('diff-file-tree')
const path = require('path')
const {maybe, tonix} = require('./common')

function diff (leftVault, leftPath, rightVault, rightPath, opts, cb) {
  if (typeof opts === 'function') cb = opts
  if (typeof opts !== 'object') opts = undefined
  opts = massageDiffOpts(opts || {})

  return maybe(cb, async function () {
    // run diff
    var changes = await dft.diff(
      {fs: leftVault, path: leftPath},
      {fs: rightVault, path: rightPath},
      opts
    )

    // apply ops filter
    if (opts.ops && opts.ops.length) {
      changes = changes.filter(change => opts.ops.includes(change.change))
    }

    return changes
  })
}

function merge (leftVault, leftPath, rightVault, rightPath, opts, cb) {
  if (typeof opts === 'function') cb = opts
  if (typeof opts !== 'object') opts = undefined
  opts = massageDiffOpts(opts || {})

  // override the shallow option, it can never be true for merges
  opts.shallow = false

  return maybe(cb, async function () {
    // run diff
    var changes = await diff(leftVault, leftPath, rightVault, rightPath, opts)

    // apply
    await dft.applyRight(
      {fs: leftVault, path: leftPath},
      {fs: rightVault, path: rightPath},
      changes
    )

    return changes
  })
}

function makeDiffFilterByPaths (targetPaths) {
  targetPaths = targetPaths.filter(v => typeof v === 'string').map(path.normalize).map(tonix)
  return (filepath) => {
    filepath = tonix(filepath)
    if (filepath === '/dpack.json') return true // never diff/merge dpack.json
    if (targetPaths.length === 0) return false

    for (let i = 0; i < targetPaths.length; i++) {
      let targetPath = targetPaths[i]

      if (filepath === targetPath) return false // exact match
      if (filepath.startsWith(targetPath) && filepath.charAt(targetPath.length) === '/') {
        return false // a parent folder
      }

    }
    return true
  }
}

function massageDiffOpts (opts) {
  return {
    compareContent: typeof opts.compareContent === 'boolean' ? opts.compareContent : false,
    shallow: typeof opts.shallow === 'boolean' ? opts.shallow : false,
    filter: opts.filter || makeDiffFilterByPaths(Array.isArray(opts.paths) ? opts.paths : []),
    ops: (Array.isArray(opts.ops) ? opts.ops : [opts.ops]).filter(v => typeof v === 'string')
  }
}

module.exports = {diff, merge}
