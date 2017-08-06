var path = require('path')
var jsreport = require('jsreport-core')
var wkhtmltopdf = require('../')
var debug = require('jsreport-debug')
require('should')

describe('wkhtmltopdf', function () {
  var reporter

  beforeEach(function () {
    reporter = jsreport()
    reporter.use(wkhtmltopdf())
    reporter.use(debug())

    return reporter.init()
  })

  it('should not fail when rendering', function () {
    var request = {
      template: { content: 'Heyx', recipe: 'wkhtmltopdf', engine: 'none' }
    }

    return reporter.render(request, {}).then(function (response) {
      response.content.toString().should.containEql('%PDF')
    })
  })

  it('should block local file access', function (done) {
    var localFile = path.join(__dirname, 'test.png')
    var request = {
      template: { content: '<img src="' + localFile + '"/>', recipe: 'wkhtmltopdf', engine: 'none' }
    }

    reporter.render(request, {}).then(function (response) {
      done('Should have failed')
    }).catch(function () {
      done()
    })
  })

  it('should propagate output to logs', function () {
    var request = {
      template: { content: 'Heyx<script>console.log("aaa")</script>', recipe: 'wkhtmltopdf', engine: 'none' }
    }

    return reporter.render(request, {}).then(function (response) {
      JSON.stringify(response.logs).should.containEql('aaa')
    })
  })
})

describe('wkhtmltopdf with local', function () {
  var reporter

  beforeEach(function () {
    reporter = jsreport()
    reporter.use(wkhtmltopdf({
      allowLocalFilesAccess: true
    }))

    return reporter.init()
  })

  it('should block local file access', function () {
    var localFile = path.join(__dirname, 'test.png')
    var request = {
      template: { content: '<img src="' + localFile + '"/>', recipe: 'wkhtmltopdf', engine: 'none' }
    }

    return reporter.render(request, {}).then(function (response) {
      response.content.toString().should.containEql('%PDF')
    })
  })
})

describe('wkhtmltopdf with proxy', function () {
  var reporter

  beforeEach(function () {
    reporter = jsreport()
    reporter.use(debug())
    reporter.use(wkhtmltopdf({
      proxy: 'foo'
    }))

    return reporter.init()
  })

  it('should propagate proxy config', function () {
    var request = {
      template: { content: 'foo', recipe: 'wkhtmltopdf', engine: 'none' }
    }

    return reporter.render(request, {}).then(function (response) {
      JSON.stringify(response.logs).should.containEql('--proxy foo')
    })
  })
})

describe('wkhtmltopdf with execOpptions.maxBuffer = 1', function () {
  var reporter

  beforeEach(function () {
    reporter = jsreport()
    reporter.use(debug())
    reporter.use(wkhtmltopdf({
      execOptions: {
        maxBuffer: 1
      }
    }))

    return reporter.init()
  })

  it('should fail because of max buffer acceeded', function (done) {
    var request = {
      template: { content: 'foo', recipe: 'wkhtmltopdf', engine: 'none' }
    }

    reporter.render(request, {}).then(function (response) {
      done(new Error('Should have fail'))
    }).catch(function () {
      done()
    })
  })
})

describe('wkhtmltopdf with execOpptions.maxBuffer = 1000 * 100', function () {
  var reporter

  beforeEach(function () {
    reporter = jsreport()
    reporter.use(debug())
    reporter.use(wkhtmltopdf({
      execOptions: {
        maxBuffer: 1000 * 100
      }
    }))

    return reporter.init()
  })

  it('should work', function () {
    var request = {
      template: { content: 'foo', recipe: 'wkhtmltopdf', engine: 'none' }
    }

    return reporter.render(request, {})
  })
})

