import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css'
import interact from 'interactjs'


const app = createApp(App)
app.use(createPinia())
app.mount('#app')


// target elements with the "draggable" class
interact('.prompt')
  .draggable({
    autoScroll: true,
    ignoreFrom: '.content',
    cursorChecker: () => null,
    listeners: {

      move: dragMoveListener,
    }
  });




function dragMoveListener(event) {


  var target = event.target
  // keep the dragged position in the data-x/data-y attributes
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

  // translate the element
  target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

  // update the posiion attributes
  target.setAttribute('data-x', x)
  target.setAttribute('data-y', y)
}

