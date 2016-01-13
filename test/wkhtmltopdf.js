var path = require("path");
var Reporter = require("jsreport-core").Reporter;
require("should");

describe("wkhtmltopdf", function () {
    var reporter;

    beforeEach(function (done) {
        reporter = new Reporter({
            rootDirectory: path.join(__dirname, "../")
        });

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
});
