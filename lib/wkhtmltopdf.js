/*! 
 * Copyright(c) 2014 Jan Blaha 
 * 
 * Recipe rendering pdf files using wkhtmltopdf.
 */

var q = require("q");
var wkhtmltopdf;


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
        tocTextSizeShrink:{type: "Edm.String"},
        title:{type: "Edm.String"}
    });

    reporter.documentStore.model.entityTypes["TemplateType"].wkhtmltopdf = {type: "jsreport.wkHtmlToPdfType"};
};


HtmlToPdf.prototype.execute = function (request, response) {
    return q.nfcall(wkhtmltopdf, request, response);
};

module.exports = function (reporter, definition) {
    reporter.wkhtmltopdf = new HtmlToPdf(reporter, definition);

    wkhtmltopdf = require("toner-wkhtmltopdf")(reporter.options);
};
