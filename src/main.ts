import './style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

// FontAwesome imports
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { 
  faSync, faSyncAlt, faPlus, faDownload, faChevronDown, faCog, 
  faFilePdf, faFileExcel, faBuilding, faExchangeAlt, faTrophy,
  faBoxes, faExclamationTriangle, faTimesCircle, faTags, faCrown,
  faArrowDown, faArrowUp, faChartLine, faLayerGroup
} from '@fortawesome/free-solid-svg-icons'

// Add icons to the library
library.add(
  faSync, faSyncAlt, faPlus, faDownload, faChevronDown, faCog,
  faFilePdf, faFileExcel, faBuilding, faExchangeAlt, faTrophy,
  faBoxes, faExclamationTriangle, faTimesCircle, faTags, faCrown,
  faArrowDown, faArrowUp, faChartLine, faLayerGroup
)

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Register FontAwesome component globally
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)

app.mount('#app')
