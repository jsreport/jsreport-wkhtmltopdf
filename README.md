# jsreport-wkhtmltopdf

[![NPM Version](http://img.shields.io/npm/v/jsreport-wkhtmltopdf.svg?style=flat-square)](https://npmjs.com/package/jsreport-wkhtmltopdf)
[![License](http://img.shields.io/npm/l/jsreport-wkhtmltopdf.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/jsreport/jsreport-wkhtmltopdf.png?branch=master)](https://travis-ci.org/jsreport/jsreport-wkhtmltopdf)

[jsreport](http://jsreport.net) recipe for rendering pdf using [wkhtmltopdf](http://wkhtmltopdf.org)

##Installation

> **npm install jsreport-wkhtmltopdf**

##Usage
To use `recipe` in for template rendering set `template.recipe=phantom-wkhtmltopdf` in the rendering request.

```js
{
  template: { content: '...', recipe: 'wkhtmltopdf', enginne: '...', wkhtmltopdf: { ... } }
}
```

##Local file access
Accessing local files from withing html templates is disabled by default. To enable it set `wkhtmltopdf.allowLocalFilesAccess: true` in the config

```js
"wkhtmltopdf": {
	"allowLocalFilesAccess": true
},
```


##jsreport-core
You can apply this extension also manually to [jsreport-core](https://github.com/jsreport/jsreport-core)

```js
var jsreport = require('jsreport-core')()
jsreport.use(require('jsreport-wkhtmltopdf')())
```
