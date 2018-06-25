const emitStream = require('emit-stream')
const EventEmitter = require('events').EventEmitter
const match = require('anymatch')
const {sep} = require('path')
const {findEntryByContentBlock, tonix} = require('./common')

function watch (vault, path) {
  // options
  if (typeof path === 'string') {
    path = [path]
  }

  // handle by type
  if (!vault.key) {
    return watchFilesystem(vault, path)
  } else if (vault.writable) {
    return watchLocal(vault, path)
  } else {
    return watchRemote(vault, path)
  }
}

function watchFilesystem (fs, paths) {
  // create new emitter and stream
  var emitter = new EventEmitter()
  var stream = emitStream(emitter)

  // wire up events
  var stopwatch = fs.watch(sep, onFileChange)
  stream.on('close', () => {
    try { stopwatch() }
    catch (e) { /* ignore - this can happen if fs's path was invalid */ }
  })

  function onFileChange (path) {
    // apply path matching
    path = tonix(path)
    path = temporaryWindowsPathFix(path, fs.base)
    if (paths && !match(paths, path)) {
      return
    }

    emitter.emit('changed', {path})
  }

  return stream
}

function watchLocal (vault, paths) {
  // create new emitter and stream
  var emitter = new EventEmitter()
  var stream = emitStream(emitter)

  // wire up events
  vault.metadata.on('append', onMetaAppend)
  stream.on('close', () => {
    vault.metadata.removeListener('append', onMetaAppend)
  })

  function onMetaAppend () {
    var block = vault.metadata.length - 1
    vault.tree._getAndDecode(block, {}, (err, entry) => {
      if (err || !entry) return

      // apply path matching
      if (paths && !match(paths, entry.name)) {
        return
      }

      // local vault, just emit changed-event immediately
      emitter.emit('changed', {path: entry.name})
    })
  }

  return stream
}

function watchRemote (vault, paths) {
  // create new emitter and stream
  var emitter = new EventEmitter()
  var stream = emitStream(emitter)

  // wire up events
  vault.metadata.on('download', onMetaDownload)
  if (vault.content) { wireContent() } else { vault.on('content', wireContent) }
  function wireContent () { vault.content.on('download', onContentDownload) }
  stream.on('close', () => {
    // unlisten events
    vault.metadata.removeListener('download', onMetaDownload)
    if (vault.content) {
      vault.content.removeListener('download', onContentDownload)
    }
  })

  // handlers
  function onMetaDownload (block) {
    vault.tree._getAndDecode(block, {}, (err, entry) => {
      if (err || !entry) return

      // apply path matching
      if (paths && !match(paths, entry.name)) {
        return
      }

      // emit
      emitter.emit('invalidated', {path: entry.name})

      // check if we can emit 'changed' now
      var isChanged = false
      if (!entry.value) {
        isChanged = true // a deletion
      } else {
        var st = vault.tree._codec.decode(entry.value)
        var range = {
          start: st.offset,
          end: st.offset + st.blocks
        }
        isChanged = isDownloaded(vault, range)
      }
      if (isChanged) {
        emitter.emit('changed', {path: entry.name})
      }
    })
  }
  async function onContentDownload (block) {
    // find the entry this applies to
    var range = await findEntryByContentBlock(vault, block)

    // emit 'changed' if downloaded
    if (range && (!paths || match(paths, range.name)) && isDownloaded(vault, range)) {
      setImmediate(() => emitter.emit('changed', {path: range.name}))
    }
  }

  return stream
}

function isDownloaded (vault, range) {
  if (!vault.content || !vault.content.opened) return false
  for (var i = range.start; i < range.end; i++) {
    if (!vault.content.has(i)) return false
  }
  return true
}

function createNetworkActivityStream (vault, path) {
  // create new emitter and stream
  var emitter = new EventEmitter()
  var stream = emitStream(emitter)
  stream.on('close', () => {
    // unlisten events
    vault.metadata.removeListener('peer-add', onNetworkChanged)
    vault.metadata.removeListener('peer-remove', onNetworkChanged)
    untrack(vault.metadata, handlers.metadata)
    untrack(vault.content, handlers.content)
  })

  // handlers
  function onNetworkChanged () {
    emitter.emit('network-changed', { connections: vault.metadata.peers.length })
  }
  var handlers = {
    metadata: {
      onDownload (block, data) {
        emitter.emit('download', { feed: 'metadata', block, bytes: data.length })
      },
      onUpload (block, data) {
        emitter.emit('upload', { feed: 'metadata', block, bytes: data.length })
      },
      onSync () {
        emitter.emit('dweb', { feed: 'metadata' })
      }
    },
    content: {
      onDownload (block, data) {
        emitter.emit('download', { feed: 'content', block, bytes: data.length })
      },
      onUpload (block, data) {
        emitter.emit('upload', { feed: 'content', block, bytes: data.length })
      },
      onSync () {
        emitter.emit('dweb', { feed: 'content' })
      }
    }
  }

  // initialize all trackers
  track(vault.metadata, 'metadata')
  if (vault.content) track(vault.content, 'content')
  else vault.on('content', () => track(vault.content, 'content'))
  vault.metadata.on('peer-add', onNetworkChanged)
  vault.metadata.on('peer-remove', onNetworkChanged)
  function track (feed, name) {
    if (!feed) return
    var h = handlers[name]
    feed.on('download', h.onDownload)
    feed.on('upload', h.onUpload)
    feed.on('dweb', h.onSync)
  }
  function untrack (feed, handlers) {
    if (!feed) return
    feed.removeListener('download', handlers.onDownload)
    feed.removeListener('upload', handlers.onUpload)
    feed.removeListener('dweb', handlers.onSync)
  }

  return stream
}

// HACK
// workaround for a bug in libuv (https://github.com/nodejs/node/issues/19170)
// paths will sometimes have some of the parent dir in them
// if so, remove that bit
// -prf
function temporaryWindowsPathFix (path, parentPath) {
  if (process.platform === 'win32') {
    let secondSlashIndex = path.indexOf('/', 1)
    let firstSegment = path.slice(1, secondSlashIndex)
    if (parentPath.endsWith(firstSegment)) {
      return path.slice(secondSlashIndex)
    }
  }
  return path
}

module.exports = {watch, createNetworkActivityStream}
