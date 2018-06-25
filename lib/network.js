const path = require('path')
const {NotFoundError} = require('@dbrowser/errors')
const {maybe} = require('./common')
const {stat} = require('./lookup')
const {readdir} = require('./read')

// download the given file(s)
function download (vault, name, cb) {
  return maybe(cb, async function () {
    // lookup the entry
    var entry = await stat(vault, name)
    if (!entry) {
      throw new NotFoundError(`The entry ${name} was not found in the vault.`)
    }

    // recurse on a directory
    if (entry.isDirectory()) {
      let listing = await readdir(vault, name)
      let promises = listing.map(subname => download(vault, path.join(name, subname)))
      return Promise.all(promises)
    }

    // prioritize a file
    if (entry.isFile()) {
      return new Promise((resolve, reject) => {
        vault.content.download({
          start: entry.offset,
          end: entry.offset + entry.blocks
        }, err => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  })
}

module.exports = {download}
