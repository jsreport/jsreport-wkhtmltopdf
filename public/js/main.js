define(["jquery", "app", "marionette", "backbone", "underscore", "core/view.base", "core/basicModel"],
    function($, app, Marionette, Backbone, _, ViewBase, ModelBase) {

        var TemplateView = ViewBase.extend({
            tagName: "li",
            template: "wkhtmltopdf-template",

            initialize: function() {
                _.bindAll(this, "isFilled");
            },

            isFilled: function() {
                return this.model.isDirty();
            },

            onClose: function() {
                this.model.templateModel.unbind("api-overrides", this.model.apiOverride, this.model);
            }
        });

        var Model = ModelBase.extend({
            setTemplate: function (templateModel) {
                this.templateModel = templateModel;

                if (templateModel.get("wkhtmltopdf")) {
                    if (templateModel.get("wkhtmltopdf").isModel)
                        this.set(templateModel.get("wkhtmltopdf").toJSON());
                    else
                        this.set(templateModel.get("wkhtmltopdf"));
                }

                templateModel.set("wkhtmltopdf", this, { silent: true});

                if (this.get("orientation") == null)
                    this.set("orientation", "portrait");


                if (this.get("pageSize") == null) {
                    this.set("pageSize", "A4");
                }

                this.listenTo(this, "change", function() {
                    templateModel.trigger("change");
                });

                this.listenTo(templateModel, "api-overrides", this.apiOverride);
            },

            isDirty: function() {
                return this.get("margin") != null || this.get("header") != null || this.get("footer") != null ||
                    this.get("width") != null || this.get("height") != null || this.get("orientation") !== "portrait" ||
                    this.get("format") !== "A4" || this.get("printDelay");
            },

            apiOverride: function(req) {
                req.template.wkhtmltopdf = {
                    orientation: this.get("orientation") || "...",
                    header: this.get("header") || "...",
                    footer: this.get("footer") || "...",
                    headerHeight: this.get("headerHeight") || "...",
                    footerHeight: this.get("footerHeight") || "...",
                    marginBottom: this.get("marginBottom") || "...",
                    orientation: this.get("orientation") || "...",
                    marginLeft: this.get("marginLeft") || "...",
                    marginRight: this.get("marginRight") || "...",
                    marginTop: this.get("marginTop") || "...",
                    pageSize: this.get("pageSize") || "...",
                    pageHeight: this.get("pageHeight") || "...",
                    pageWidth: this.get("pageWidth") || "...",
                    toc: this.get("toc") || "...",
                    tocHeaderText: this.get("tocHeaderText") || "...",
                    tocLevelIndentation: this.get("tocLevelIndentation") || "..."                    ,
                    tocTextSizeShrink: this.get("tocTextSizeShrink") || "..."
                };
            }
        });

        app.on("template-extensions-render", function(context) {
            var view;

            function renderRecipeMenu() {
                if (context.template.get("recipe") === "wkhtmltopdf") {
                    var model = new Model();
                    model.setTemplate(context.template);
                    view = new TemplateView({ model: model});
                    
                    context.extensionsRegion.show(view, "wkhtmltopdf");
                } else {
                    if (view != null)
                        $(view.el).remove();
                }
            }

            renderRecipeMenu();

            context.template.on("change:recipe", function() {
                renderRecipeMenu();
            });
        });
    });
