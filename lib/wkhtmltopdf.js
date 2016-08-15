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
var q = require('q')
var wkhtmltopdf = require('wkhtmltopdf-installer')

var HtmlToPdf = function (reporter, definition) {
  this.reporter = reporter

  this.allowLocalFilesAccess = definition.options.hasOwnProperty('allowLocalFilesAccess') ? definition.options.allowLocalFilesAccess : false

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
    keepRelativeLinks: { type: 'Edm.Boolean' }
  })

  if (reporter.documentStore.model.entityTypes['TemplateType']) {
    reporter.documentStore.model.entityTypes['TemplateType'].wkhtmltopdf = { type: 'jsreport.wkHtmlToPdfType' }
  }
}

function createParams (request, options, id) {
  var params = []

  if (!options.allowLocalFilesAccess) {
    params.push('--disable-local-file-access')
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

function processPart (options, req, type, id) {
  if (!options[type]) {
    return q()
  }

  var _req = extend(true, {}, req)
  extend(true, _req.template, { content: options[type], recipe: 'html' })
  _req.options.isChildRequest = true

  return req.reporter.render(_req).then(function (res) {
    return q.nfcall(fs.writeFile, path.join(req.reporter.options.tempDirectory, id + type + '.html'), res.content.toString())
  })
}

function processHeaderAndFooter (options, req, id) {
  return processPart(options, req, 'header', id).then(function () {
    return processPart(options, req, 'footer', id).then(function () {
      return processPart(options, req, 'cover', id)
    })
  })
}

HtmlToPdf.prototype.execute = function (request, response) {
  request.template.wkhtmltopdf = request.template.wkhtmltopdf || {}
  var options = request.template.wkhtmltopdf || {}
  options.allowLocalFilesAccess = this.allowLocalFilesAccess

  var id = uuid()

  return q.nfcall(fs.writeFile, path.join(request.reporter.options.tempDirectory, id + '.html'), response.content.toString()).then(function () {
    return processHeaderAndFooter(options, request, id)
  }).then(function () {
    var parameters = createParams(request, options, id)

    var deferred = q.defer()
    childProcess.execFile(wkhtmltopdf.path, parameters, function (err, stederr, stdout) {
      if (err) {
        return deferred.reject(err)
      }

      response.headers['Content-Type'] = 'application/pdf'
      response.headers['Content-Disposition'] = 'inline; filename="report.pdf"'
      response.headers['File-Extension'] = 'pdf'

      fs.readFile(path.join(request.reporter.options.tempDirectory, id + '.pdf'), function (err, buf) {
        if (err) {
          return deferred.reject(err)
        }

        response.content = buf
        deferred.resolve(response)
      })
    })

    return deferred.promise
  })
}

module.exports = function (reporter, definition) {
  reporter.wkhtmltopdf = new HtmlToPdf(reporter, definition)
}
