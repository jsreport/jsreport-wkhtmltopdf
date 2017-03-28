/*!
 * Copyright(c) 2014 Jan Blaha
 *
 * Recipe rendering pdf files using wkhtmltopdf.
 */

var uuid = require('uuid').v1
var path = require('path')
var fs = require('fs')
var childProcess = require('child_process')
var extend = require('node.extend')
var Promise = require('bluebird')
var wkhtmltopdf = require('wkhtmltopdf-installer')
var writeFileAsync = Promise.promisify(fs.writeFile)

var HtmlToPdf = function (reporter, definition) {
  this.reporter = reporter
  this.definition = definition

  this.allowLocalFilesAccess = definition.options.hasOwnProperty('allowLocalFilesAccess') ? definition.options.allowLocalFilesAccess : false
  this.wkhtmltopdfVersions = definition.options.wkhtmltopdfVersions = [{ version: wkhtmltopdf.version }]

  reporter.extensionsManager.recipes.push({
    name: 'wkhtmltopdf',
    execute: HtmlToPdf.prototype.execute.bind(this)
  })

  reporter.documentStore.registerComplexType('wkHtmlToPdfType', {
    orientation: { type: 'Edm.String' },
    header: { type: 'Edm.String' },
    footer: { type: 'Edm.String' },
    headerHeight: { type: 'Edm.String' },
    footerHeight: { type: 'Edm.String' },
    dpi: {type: 'Edm.String'},
    marginBottom: { type: 'Edm.String' },
    marginLeft: { type: 'Edm.String' },
    marginRight: { type: 'Edm.String' },
    marginTop: { type: 'Edm.String' },
    pageSize: { type: 'Edm.String' },
    pageHeight: { type: 'Edm.String' },
    pageWidth: { type: 'Edm.String' },
    cover: { type: 'Edm.String' },
    toc: { type: 'Edm.Boolean' },
    tocHeaderText: { type: 'Edm.String' },
    tocLevelIndentation: { type: 'Edm.String' },
    tocTextSizeShrink: { type: 'Edm.String' },
    title: { type: 'Edm.String' },
    keepRelativeLinks: { type: 'Edm.Boolean' },
    disableSmartShrinking: { type: 'Edm.Boolean' },
    printMediaType: { type: 'Edm.Boolean' },
    javascriptDelay: { type: 'Edm.String' },
    windowStatus: { type: 'Edm.String' },
    wkhtmltopdfVersion: { type: 'Edm.String' }
  })

  if (reporter.documentStore.model.entityTypes['TemplateType']) {
    reporter.documentStore.model.entityTypes['TemplateType'].wkhtmltopdf = { type: 'jsreport.wkHtmlToPdfType' }
  }
}

function createParams (reporter, request, options, definition, id) {
  var params = []

  params.push('--debug-javascript')

  if (!options.allowLocalFilesAccess) {
    params.push('--disable-local-file-access')
  }

  Object.keys(definition.options).forEach(function (k) {
    if (k === 'allowLocalFilesAccess' || k === 'wkhtmltopdfVersions') {
      return
    }

    params.push('--' + k)

    if (definition.options[k] !== true) {
      params.push(definition.options[k])
    }
  })
  if (options.dpi) {
    params.push('--dpi')
    params.push(options.dpi)
  }
  if (options.javascriptDelay) {
    params.push('--javascript-delay')
    params.push(options.javascriptDelay)
  }
  if (options.windowStatus) {
    params.push('--window-status')
    params.push(options.windowStatus)
  }

  if (options.pageHeight) {
    params.push('--page-height')
    params.push(options.pageHeight)
  }

  if (options.pageWidth) {
    params.push('--page-width')
    params.push(options.pageWidth)
  }

  if (options.pageSize) {
    params.push('--page-size')
    params.push(options.pageSize)
  }

  if (options.marginBottom || options.marginBottom === 0) {
    params.push('--margin-bottom')
    params.push(options.marginBottom)
  }

  if (options.marginLeft || options.marginLeft === 0) {
    params.push('--margin-left')
    params.push(options.marginLeft)
  }

  if (options.marginRight || options.marginRight === 0) {
    params.push('--margin-right')
    params.push(options.marginRight)
  }

  if (options.marginTop || options.marginTop === 0) {
    params.push('--margin-top')
    params.push(options.marginTop)
  }

  if (options.orientation) {
    params.push('--orientation')
    params.push(options.orientation)
  }

  if (options.title) {
    params.push('--title')
    params.push(options.title)
  }

  if (options.header) {
    if (options.headerHeight) {
      params.push('--header-spacing')
      params.push(options.headerHeight)
    }

    params.push('--header-html')
    params.push('file:///' + path.join(request.reporter.options.tempDirectory, id + 'header.html'))
  }

  if (options.footer) {
    if (options.footerHeight) {
      params.push('--footer-spacing')
      params.push(options.footerHeight)
    }

    params.push('--footer-html')
    params.push('file:///' + path.join(request.reporter.options.tempDirectory, id + 'footer.html'))
  }

  if (options.cover) {
    params.push('cover')
    params.push('file:///' + path.join(request.reporter.options.tempDirectory, id + 'cover.html'))
  }

  if (options.keepRelativeLinks && JSON.parse(options.keepRelativeLinks)) {
    params.push('--keep-relative-links')
  }

  if (options.printMediaType && JSON.parse(options.printMediaType)) {
    params.push('--print-media-type')
  }
  if (options.printMediaType && JSON.parse(options.disableSmartShrinking)) {
    params.push('--disable-smart-shrinking')
  }

  if (options.toc && JSON.parse(options.toc)) {
    params.push('toc')

    if (options.tocHeaderText) {
      params.push('--toc-header-text')
      params.push(options.tocHeaderText)
    }

    if (options.tocLevelIndentation) {
      params.push('--toc-level-indentation ')
      params.push(options.tocLevelIndentation)
    }

    if (options.tocTextSizeShrink) {
      params.push('--toc-text-size-shrink ')
      params.push(options.tocTextSizeShrink)
    }
  }

  params.push(path.join(request.reporter.options.tempDirectory, id + '.html'))
  params.push(path.join(request.reporter.options.tempDirectory, id + '.pdf'))

  return params
}

function processPart (reporter, options, req, type, id) {
  if (!options[type]) {
    return Promise.resolve()
  }

  req.logger.debug('Starting child request to render pdf ' + type)

  var _req = extend(true, {}, req)
  extend(true, _req.template, { content: options[type], recipe: 'html' })
  _req.options.isChildRequest = true

  return reporter.render(_req).then(function (res) {
    return writeFileAsync(path.join(reporter.options.tempDirectory, id + type + '.html'), res.content.toString())
  })
}

function processHeaderAndFooter (reporter, options, req, id) {
  return processPart(reporter, options, req, 'header', id).then(function () {
    return processPart(reporter, options, req, 'footer', id).then(function () {
      return processPart(reporter, options, req, 'cover', id)
    })
  })
}

HtmlToPdf.prototype.execute = function (request, response) {
  var self = this
  request.template.wkhtmltopdf = request.template.wkhtmltopdf || {}
  var options = request.template.wkhtmltopdf || {}
  options.allowLocalFilesAccess = this.allowLocalFilesAccess
  options.proxy = this.proxy

  var id = uuid()

  return writeFileAsync(path.join(request.reporter.options.tempDirectory, id + '.html'), response.content.toString()).then(function () {
    return processHeaderAndFooter(self.reporter, options, request, id)
  }).then(function () {
    return self.conversion(createParams(self.reporter, request, options, self.definition, id), request).then(function (buf) {
      response.headers['Content-Type'] = 'application/pdf'
      response.headers['Content-Disposition'] = 'inline; filename="report.pdf"'
      response.headers['File-Extension'] = 'pdf'

      response.content = buf
    })
  })
}

HtmlToPdf.prototype.conversion = function (parameters, request) {
  var exePath = wkhtmltopdf.path
  if (request.template.wkhtmltopdf.wkhtmltopdfVersion) {
    var wkhtmltopdfVersions = this.definition.options.wkhtmltopdfVersions.filter(function (p) {
      return p.version === request.template.wkhtmltopdf.wkhtmltopdfVersion
    })

    // default doesn't have a path
    if (wkhtmltopdfVersions.length === 1 && wkhtmltopdfVersions[0].path) {
      exePath = wkhtmltopdfVersions[0].path
    }
  }

  request.logger.debug('wkhtmltopdf  ' + parameters.join(' '))

  return new Promise(function (resolve, reject) {
    childProcess.execFile(exePath, parameters, function (err, stderr, stdout) {
      request.logger.debug((err || '') + (stderr || '') + (stdout || ''))

      if (err) {
        return reject(err)
      }

      fs.readFile(parameters[parameters.length - 1], function (err, buf) {
        if (err) {
          return reject(err)
        }

        resolve(buf)
      })
    })
  })
}

module.exports = function (reporter, definition) {
  reporter.wkhtmltopdf = new HtmlToPdf(reporter, definition)
}
