# FirstConnectedMixin
The purpose of `FirstConnectedMixin` is to add a callback hook the first, and only first time, 
the Element is connected to a DOM.

`FirstConnectedMixin` echoes the .ready() callback in Polymer.

### Example of use:

```javascript
import {FirstConnectedMixin} from "https://rawgit.com/orstavik/JoiComponents/master/src/FirstConnectedMixin.js";

class AlloAllo extends FirstConnectedMixin(HTMLElement) {

  firstConnectedCallback(){
    console.log("1. I will tell this only once.");
  }
  
  connectedCallback(){
    super.connectedCallback();
    console.log("2. Do you remember what I told you.");
  }
  
  disconnectedCallback(){
    super.disconnectedCallback();
    console.log("3. Ahh, 'Enri! `Enri!");
  }
}
customElements.define("allo-allo", AlloAllo);
```                                                                   
and you can test it like this:

```javascript
const allo = document.createElement("allo-allo");
const body = document.querySelector("body");
function connectAndDisconnect() {
  body.appendChild(allo);
  requestAnimationFrame(()=>requestAnimationFrame(()=> body.removeChild(allo)));
}
connectAndDisconnect();
//1. I will tell this only once.
//2. Do you remember what I told you.
//3. Ahh, 'Enri! `Enri!
setTimeout(connectAndDisconnect, 100);
//2. Do you remember what I told you.
//3. Ahh, 'Enri! `Enri!
setTimeout(connectAndDisconnect, 200);
//2. Do you remember what I told you.
//3. Ahh, 'Enri! `Enri!
```                      

Test it out on [codepen](https://codepen.io/orstavik/pen/XEwPaE).