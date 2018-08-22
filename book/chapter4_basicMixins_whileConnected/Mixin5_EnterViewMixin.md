## EnterViewMixin                                                 

`enterViewCallback()` triggers the first time the element comes into view.
`EnterViewMixin` uses InterSectionObserver.
No fallback using requestAnimationFrame implemented.
**Not tested**.

### Example: LazyLoadData 

```javascript
import {EnterViewMixin} from "https://rawgit.com/orstavik/JoiComponents/master/src/EnterViewMixin.js";

class LazyLoadImage extends EnterViewMixin(HTMLElement) {
  
  connectedCallback(){
    super.connectedCallback();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<img>";
  }
  
  enterViewCallback(){
    console.log("loading image data");
    this.shadowRoot.children[0].src = "https://www.google.no/images/branding/googlelogo/2x/googlelogo_color_120x44dp.png";
  }
}

customElements.define("lazy-img", LazyLoadImage);
```
See it in action on [codepen.io](https://codepen.io/orstavik/pen/JLgwMM)

### Implementation details
* `enterViewCallback()` runs only once. The `EnterViewMixin` removes its 
`IntersectionObserver` or equivalent after the initial trigger
so that the IntersectionObserver stops running. 
If you need to register an `IntersectionObserver` that 
registers more than once, use `IntersectionObserver` directly.
                              
#### References
* https://github.com/w3c/IntersectionObserver/blob/master/explainer.md
* https://developers.google.com/web/updates/2016/04/intersectionobserver