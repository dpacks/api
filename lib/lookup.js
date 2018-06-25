const {maybe, toDBrowserError} = require('./common')

// lookup information about a file
function stat (vault, name, cb) {
  return maybe(cb, new Promise((resolve, reject) => {
    // run stat operation
    vault.stat(name, (err, st) => {
      if (err) reject(toDBrowserError(err, 'stat'))
      else {
        // read download status
        st.downloaded = 0
        if (!vault.key) {
          // fs, not an vault
          st.downloaded = st.blocks
        } else {
          if (vault.content && vault.content.length) {
            st.downloaded = vault.content.downloaded(st.offset, st.offset + st.blocks)
          }
        }
        resolve(st)
      }
    })
  }))
}

module.exports = {stat}
