/*globals describe, it, beforeEach, afterEach */

var assert = require("assert"),
    fs = require('fs'),
    path = require("path"),
    describeReporting = require("jsreport").describeReporting;

describeReporting(path.join(__dirname, "../"), ["html", "templates", "wkhtmltopdf"], function(reporter) {

    describe('phantom pdf', function () {
     
        it('should not fail when rendering', function(done) {
            var request = {
                template: { content: "Heyx", recipe: "wkhtmltopdf", engine:"jsrender" },
                data: null
            };

            reporter.render(request, {}).then(function(response) {
                return response.result.toBuffer().then(function(buf) {
                    assert.equal(buf.toString("utf8").indexOf("%PDF") === 0, true);
                    done();
                });

            }).catch(done);
        });

    });
});
