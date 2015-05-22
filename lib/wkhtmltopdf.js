/*! 
 * Copyright(c) 2014 Jan Blaha 
 * 
 * Recipe rendering pdf files using wkhtmltopdf.
 */

var uuid = require("uuid").v1,
    path = require("path"),
    fs = require("fs"),
    q = require("q"),
    FS = require("q-io/fs"),
    childProcess = require('child_process'),
    mkdirp = require('mkdirp'),
    extend = require("node.extend"),
    wkhtmltopdf = require("wkhtmltopdf-installer");


var HtmlToPdf = function (reporter, definition) {
    this.reporter = reporter;

    reporter.extensionsManager.recipes.push({
        name: "wkhtmltopdf",
        execute: HtmlToPdf.prototype.execute.bind(this)
    });

    reporter.documentStore.registerComplexType("wkHtmlToPdfType", {
        orientation: {type: "Edm.String"},
        header: {type: "Edm.String"},
        footer: {type: "Edm.String"},
        headerHeight: {type: "Edm.String"},
        footerHeight: {type: "Edm.String"},
        marginBottom: {type: "Edm.String"},
        marginLeft: {type: "Edm.String"},
        marginRight: {type: "Edm.String"},
        marginTop: {type: "Edm.String"},
        pageSize: {type: "Edm.String"},
        pageHeight: {type: "Edm.String"},
        pageWidth: {type: "Edm.String"},
        toc: {type: "Edm.Boolean"},
        tocHeaderText: {type: "Edm.String"},
        tocLevelIndentation:{type: "Edm.String"},
        tocTextSizeShrink:{type: "Edm.String"}
    });

    reporter.documentStore.model.entityTypes["TemplateType"].wkhtmltopdf = {type: "jsreport.wkHtmlToPdfType"};
};

HtmlToPdf.prototype._optionsToParameters = function (request, options, id) {
    var params = [];

    params.push("--disable-local-file-access");

    if (options.pageHeight) {
        params.push("--page-height");
        params.push(options.pageHeight);
    }

    if (options.pageWidth) {
        params.push("--page-width");
        params.push(options.pageWidth);
    }

    if (options.pageSize) {
        params.push("--page-size");
        params.push(options.pageSize);
    }

    if (options.marginBottom) {
        params.push("--margin-bottom");
        params.push(options.marginBottom);
    }

    if (options.marginLeft) {
        params.push("--margin-left");
        params.push(options.marginLeft);
    }

    if (options.marginRight) {
        params.push("--margin-right");
        params.push(options.marginRight);
    }

    if (options.marginTop) {
        params.push("--margin-top");
        params.push(options.marginTop);
    }

    if (options.orientation) {
        params.push("--orientation");
        params.push(options.orientation);
    }

    if (options.header) {
        if (options.headerHeight) {
            params.push("--header-spacing");
            params.push(options.headerHeight);
        }

        params.push("--header-html");
        params.push("file:///" + path.join(this.reporter.options.tempDirectory, id + "header.html"));
    }

    if (options.footer) {
        if (options.footerHeight) {
            params.push("--footer-spacing");
            params.push(options.footerHeight);
        }

        params.push("--footer-html");
        params.push("file:///" + path.join(this.reporter.options.tempDirectory, id + "footer.html"));
    }

    if (options.toc && JSON.parse(options.toc)) {
        if (options.tocHeaderText) {
            params.push("--toc-header-text");
            params.push(options.tocHeaderText);
        }

        if (options.tocLevelIndentation) {
            params.push("--toc-level-indentation ");
            params.push(options.tocLevelIndentation);
        }

        if (options.tocTextSizeShrink) {
            params.push("--toc-text-size-shrink ");
            params.push(options.tocTextSizeShrink);
        }
        params.push("toc");
    }

    params.push(path.join(this.reporter.options.tempDirectory, id + ".html"));
    params.push(path.join(this.reporter.options.tempDirectory, id + ".pdf"));

    return params;
};

HtmlToPdf.prototype.execute = function (request, response) {
    var self = this;
    request.template.wkhtmltopdf = request.template.wkhtmltopdf || {};

    request.template.recipe = "html";
    var options = request.template.wkhtmltopdf || {};

    var id = uuid();

    return this.reporter.executeRecipe(request, response)
        .then(function () {
            return FS.write(path.join(self.reporter.options.tempDirectory, id + ".html"), response.result);
        })
        .then(function () {
            return self._processHeaderFooter(id, options, request, "header");
        })
        .then(function () {
            return self._processHeaderFooter(id, options, request, "footer");
        })
        .then(function () {
            var parameters = self._optionsToParameters(request, options, id);
            var promise = q.defer();
            childProcess.execFile(wkhtmltopdf.path, parameters, function (err, stederr, stdout) {
                if (err) {
                    return promise.reject(err);
                }

                promise.resolve();
            });

            return promise.promise;
        }).then(function () {
            request.options.isChildRequest = false;
            response.headers["Content-Type"] = "application/pdf";
            response.headers["Content-Disposition"] = "inline; filename=\"report.pdf\"";
            response.headers["File-Extension"] = "pdf";

            return FS.read(path.join(self.reporter.options.tempDirectory, id + ".pdf"), "b");
        }).then(function (result) {
            response.result = new Buffer(result);
        });
};

HtmlToPdf.prototype._processHeaderFooter = function (id, options, request, type) {
    if (!options[type])
        return q(null);

    var req = extend(true, {}, request);
    req.template = {content: options[type], recipe: "html", helpers: request.template.helpers, engine: request.template.engine};
    req.data = extend(true, {}, request.data);
    req.options.isChildRequest = true;
    var self = this;

    return this.reporter.render(req).then(function (resp) {
        return resp.result.toBuffer().then(function(buf) {
            return FS.write(path.join(self.reporter.options.tempDirectory, id + type + ".html"), buf);
        });
    });
};

module.exports = function (reporter, definition) {
    reporter.wkhtmltopdf = new HtmlToPdf(reporter, definition);

    if (!fs.existsSync(reporter.options.tempDirectory)) {
        mkdirp.sync(reporter.options.tempDirectory);
    }
};
