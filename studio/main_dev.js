import WKEditor from './WKEditor.js'
import Properties from './WKProperties.js'
import WKTitle from './WKTitle.js'
import * as Constants from './constants.js'
import Studio from 'jsreport-studio'

Studio.addPropertiesComponent('wkhtmltopdf', Properties, (entity) => entity.__entitySet === 'templates' && entity.recipe === 'wkhtmltopdf')

Studio.addEditorComponent(Constants.WK_TAB_EDITOR, WKEditor)
Studio.addTabTitleComponent(Constants.WK_TAB_TITLE, WKTitle)

Studio.addApiSpec({
  template: {
    wkhtmltopdf: {
      orientation: '...',
      header: '...',
      footer: '...',
      headerHeight: '...',
      footerHeight: '...',
      marginBottom: '...',
      marginLeft: '...',
      marginRight: '...',
      marginTop: '...',
      pageSize: '...',
      pageHeight: '...',
      pageWidth: '...',
      toc: '...',
      tocHeaderText: '...',
      tocLevelIndentation: '...',
      tocTextSizeShrink: '...'
    }
  }
})
