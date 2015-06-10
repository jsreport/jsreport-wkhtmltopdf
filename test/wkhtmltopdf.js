/*globals describe, it, beforeEach, afterEach */

var assert = require("assert"),
    fs = require('fs'),
    path = require("path"),
    describeReporting = require("jsreport").describeReporting;

describeReporting(path.join(__dirname, "../"), ["html", "templates", "wkhtmltopdf"], function (reporter) {

    describe('wkhtmltopdf', function () {

        it('should not fail when rendering', function (done) {
            var request = {
                template: {content: "Heyx", recipe: "wkhtmltopdf", engine: "none"},
                data: null
            };

            reporter.render(request, {}).then(function (response) {
                assert.equal(response.content.toString("utf8").indexOf("%PDF") === 0, true);
                done();
            }).catch(done);
        });

    });
});
