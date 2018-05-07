module.exports = {
  'name': 'wkhtmltopdf',
  'main': 'lib/wkhtmltopdf.js',
  'dependencies': ['templates'],
  'optionsSchema': {
    extensions: {
      wkhtmltopdf: {
        type: 'object',
        properties: {
          execOptions: {
            type: 'object',
            properties: {
              env: { type: 'object' },
              maxBuffer: { type: 'number' }
            }
          },
          allowLocalFilesAccess: { type: 'boolean' }
        }
      }
    }
  },
  'embeddedSupport': true
}
