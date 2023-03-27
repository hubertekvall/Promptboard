import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/main.css'
import interact from 'interactjs'


const app = createApp(App)
app.use(createPinia())
app.mount('#app')




// target elements with the "draggable" class
interact('#testDiv')
  .draggable({
    inertia: true,
    autoScroll: true,

    listeners: {
     
      move: dragMoveListener,


    }
  })

function dragMoveListener (event) {
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
// makeDraggable(document.getElementById("testDiv"));


// function makeDraggable(element) {
//     let deltaMouse = {x: 0, y: 0};
//     let previousMouse = {x:0, y: 0};
   
//     element.onmousedown = onMouseDown;

//     function onMouseDown (e)  {
//       e = e || window.event;
//       e.preventDefault();
      
//       previousMouse = {x: e.clientX, y: e.clientY};

//       document.onmouseup = onMouseUp;
//       document.onmousemove = onMouseMove;
//     }
  
//     function onMouseMove (e)  {
//       e = e || window.event;
//       e.preventDefault();
      
//       deltaMouse = {x: previousMouse.x - e.clientX, y: previousMouse.y  - e.clientY };
//       previousMouse = {x: e.clientX, y: e.clientY};
    
//       element.style.top = (element.offsetTop - deltaMouse.y) + "px";
//       element.style.left = (element.offsetLeft - deltaMouse.x) + "px";
//     }
  
//     function onMouseUp () {
//       document.onmouseup = null;
//       document.onmousemove = null;
//     }
//   }
