const fs = require('fs')

exports.logToFile = async (fileName, object, options = {}) => {
  const { mode = 'append', timestamp = false } = options

  const logsDirPath = `${__dirname}/.logs`
  if (!fs.existsSync(logsDirPath)) {
      fs.mkdirSync(logsDirPath, { recursive: true })
  }
  const fullPath = `${logsDirPath}/${fileName}`
  const contents = typeof object === 'string' ? object : JSON.stringify(object, null, 2)
  const now = new Date()
  const text = timestamp ? now.toString() + '\n---\n' + contents : contents
  if (mode === 'append') {
      const stream = fs.createWriteStream(fullPath, { flags: 'a' })
      stream.write(text + '\n')
      stream.end()
  } else {
      fs.writeFile(fullPath, text, (error) => {
          // throws an error, you could also catch it here
          if (error) throw error

          // eslint-disable-next-line no-console
          console.log(`Object saved to ${fullPath}`)
      })
  }
}