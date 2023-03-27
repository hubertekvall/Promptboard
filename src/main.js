import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css'
import interact from interact


const app = createApp(App)
app.use(createPinia())
app.mount('#app')





makeDraggable(document.getElementById("testDiv"));


function makeDraggable(element) {
    let deltaMouse = {x: 0, y: 0};
    let previousMouse = {x:0, y: 0};
   
    element.onmousedown = onMouseDown;

    function onMouseDown (e)  {
      e = e || window.event;
      e.preventDefault();
      
      previousMouse = {x: e.clientX, y: e.clientY};

      document.onmouseup = onMouseUp;
      document.onmousemove = onMouseMove;
    }
  
    function onMouseMove (e)  {
      e = e || window.event;
      e.preventDefault();
      
      deltaMouse = {x: previousMouse.x - e.clientX, y: previousMouse.y  - e.clientY };
      previousMouse = {x: e.clientX, y: e.clientY};
    
      element.style.top = (element.offsetTop - deltaMouse.y) + "px";
      element.style.left = (element.offsetLeft - deltaMouse.x) + "px";
    }
  
    function onMouseUp () {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
