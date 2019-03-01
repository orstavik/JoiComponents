# Pattern: StyleCallback

A prime purpose of web components is to encapsulate style. So lets encapsulate a
CustomCssShortcut in a web component.

```html
<script>  
  class BlueBlue extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          div {                                                                
            background-color: lightblue;                                  /*[1]*/
            color: black;
            border: 2px solid darkblue;
          }
        </style>
        <div style="color: darkblue;">
          <slot></slot>
        </div>`;                                                          //[2]
    }
  
    styleCallback(){                                                      
      var newValue = getComputedStyleValue(this, "_color-mode");          //[1]
      var values = newValue.trim().split(/\s+/);
      var color = values[0];
      var mode = values[1];
      var div = this.shadowRoot.children[1];
      div.style.color = (mode === "night") ? "white" : "black";
      div.style.backgroundColor = (mode === "night") ? "dark" + color : "light" + color;
      div.style.borderColor = (mode === "night") ? "light" + color : "dark" + color;
    }
  }
  
  customElements.define("blue-blue", BlueBlue);
</script>
<style>
  blue-blue {
    _color-mode: green day;
  }
</style>
  
<blue-blue style="_color-mode: red night;">                               <!--3-->
  blue-blue turns red night!
</blue-blue>
<blue-blue>                                                               <!--3-->
  blue-blue turns green day!
</blue-blue>

<script>
  setTimeout(function(){
    var blues = document.querySelectorAll("blue-blue");
    for (var i = 0; i < blues.length; i++) {
      blues[i].styleCallback();
    }
  }, 5000);
</script>
//1. the observe the 
```

## Where should CustomCssShortcuts be observed?

The web component uses the CustomCssShortcut to enable the users of the web component (in the lightDOM)
to specify a style for the web component. 
The CustomCssShortcut is not a transient CSS property, it should not pass into the shadowDOM borders of 
web components used inside the initial web component styled. Thus, it should not be a CSS variable.
That means that the only place the web component has access to the CustomCssShortcut is on the host node
(`this`).

This architecture also matches the form of other lifecycle callbacks.
Lifecycle callbacks is a means by which the browser can trigger a function in a web component that
are caused by changes in the lightDOM around a custom element. 
Changes to a style property of the web component is an external change, and thus fits well as a 
lifecycle callback.

> todo add this comment to slottablesCallback too, that this is a true lightDOM change and that a 
lifecycle callback should be that. While slotchangeCallback is an inner, shadowDOM change, 
which should not be a lifecycle callback.

Also, by listening for style changes on the `host` node, the browser could (in theory) *only*
process the CSSOM of the lightDOM document and avoid processing the shadowDOM CSSOM.
However, due to the `:host` selector, and I am not sure if such partial CSSOM processing is done by any 
browser yet, this speed efficiency will be limited.

> By observing changes on the upper, lightDOM level, the browser would be able to skip processing 
  the CSS of the shadow elements, even though the `:host` operator is problematic.
  The `host` operator should have been a `shadowRoot` operator, working on the shadowRoot document node.
  This would have given the browser the ability to process CSS down-to-current-document level.

If style properties of the web element is changed from within, we do not need a reactive method
to control it. Internally induced updates of style can be triggered imperatively.
This again fits with the established conventions for lifecycle callbacks of custom elements as
reactiving to external, contextual changes in the lightDOM. 

## References

 * 


## References

 * 