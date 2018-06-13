# Route 1: HashChangedMixin

The HashchangedMixin gives us a callback everytime the hash tail changes.
The hash tail is the part of the URL:
 * prefixed with `#`,
 * located *after* the path (~file location~), and
 * located *before* the query.
 
The hash tail is used by the browser to navigate (scroll up or down) within a single web page.

The simplest form of routing is listening for the changes of the hash of the browser `location` object.
Every time the hash changes, the browser dispatches a `hashchange` event on the `window`. (Or window.location?)
The HashChangedMixin captures this event, and 
triggers a `hashchangedCallback(newHash, oldHash)` callback.

## Mixin: HashChanged

```javascript
const HashChangedMixin = function(Base){
  return class HashChangedMixin extends Base {

    constructor() {
      super();
      this.arr =[];
      this._listener = ()=> this.getValue();
    }
    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      window.addEventListener("hashchange", this._listener);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      window.removeEventListener("hashchange", this._listener);
    }
    getValue() {
      this.arr.unshift(window.location.hash.slice(1));
      this.hashChangedCallback(this.arr[0]);
    }
  }
};
```

## Example: Reacting to hashchangedCallback()
Here is how it is used:

```html
<script type="module">
  class HashComp extends HashChangedMixin(HTMLElement) {
  
    connectedCallback(){
      super.connectedCallback();
      this.style.display = "block";
      this.style.width = "100px";
      this.style.height = "100px";
      this.style.background = "black";
    }
    
    hashChangedCallback(newHash){
      this.style.background = newHash;
    }
  }  
  customElements.define("hash-comp", HashComp);
</script>

<a href="#red">Red</a>
<a href="#green">Green</a>
<a href="#blue">Blue</a>
<hash-comp></hash-comp>
```

## References 
1. [MDN: `hashchange` event](https://developer.mozilla.org/en-US/docs/Web/Events/hashchange)
2. [MDN: `window.location`](https://developer.mozilla.org/en-US/docs/Web/API/Window/location)