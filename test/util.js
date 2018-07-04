const ddrive = require('@ddrive/core')
const ScopedFS = require('@dbrowser/vfswrapper')
const fs = require('fs')
const os = require('os')
const path = require('path')

const FAKE_DPACK_KEY = 'f'.repeat(64)

function createVault (names) {
  return populate(ddrive(tmpdir()), names)
}

function createFs (names) {
  return populate(new ScopedFS(tmpdir()), names)
}

async function populate (target, names) {
  names = names || []
  for (var i = 0; i < names.length; i++) {
    let name = names[i]
    let content = 'content'
    if (typeof name === 'object') {
      content = name.content
      name = name.name
    }

    await new Promise(resolve => {
      if (name.slice(-1) === '/') {
        target.mkdir(name, resolve)
      } else {
        target.writeFile(name, content, resolve)
      }
    })
  }

  return target
}

function tmpdir () {
  return fs.mkdtempSync(os.tmpdir() + path.sep + 'dpack-api-v2-test-')
}

function tonix (str) {
  return str.replace(/\\/g, '/')
}

module.exports = {FAKE_DPACK_KEY, createVault, createFs, tmpdir, tonix}
