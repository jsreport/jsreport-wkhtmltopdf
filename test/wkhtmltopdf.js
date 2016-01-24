var path = require("path");
var jsreport = require("jsreport-core");
var wkhtmltopdf = require("../");
require("should");

describe("wkhtmltopdf", function () {
    var reporter;

    beforeEach(function (done) {
        reporter = jsreport();
        reporter.use(wkhtmltopdf());

        reporter.init().then(function () {
            done()
        }).fail(done)
    });

    it("should not fail when rendering", function (done) {
        var request = {
            template: {content: "Heyx", recipe: "wkhtmltopdf", engine: "none"}
        };

        reporter.render(request, {}).then(function (response) {
            response.content.toString().should.containEql("%PDF");
            done()
        }).catch(done)
    })

    it("should block local file access", function (done) {
        var localFile = path.join(__dirname, "test.png");
        var request = {
            template: {content: "<img src='" + localFile + "'/>", recipe: "wkhtmltopdf", engine: "none"}
        };

        reporter.render(request, {}).then(function (response) {
            done('Should have failed')
        }).catch(function() {
            done()
        })
    })
});

describe("wkhtmltopdf with local", function () {
    var reporter;

    beforeEach(function (done) {
        reporter = jsreport();
        reporter.use(wkhtmltopdf({
            allowLocalFilesAccess: true
        }));

        reporter.init().then(function () {
            done()
        }).fail(done)
    });


    it("should block local file access", function (done) {
        var localFile = path.join(__dirname, "test.png");
        var request = {
            template: {content: "<img src='" + localFile + "'/>", recipe: "wkhtmltopdf", engine: "none"}
        };

        reporter.render(request, {}).then(function (response) {
            response.content.toString().should.containEql("%PDF");
            done()
        }).catch(done)
    })
});

