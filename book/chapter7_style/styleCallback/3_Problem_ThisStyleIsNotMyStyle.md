# Problem: ThisStyleIsNotMyStyle

## Why style the element itself?

There are several reasons why we would like to style the root element, ie. the host node, 
1. we want a smaller shadowDOM tree.
2. we want to style the element from the lightDOM. But at the same time have some default style values.

All HTML elements have their own default style specification.
 * `<span>` elements are `display: inline`, while `<div>` elements are `display: block`.
 * `<b>` elements have `font-weight: bold`, while `<i>` elements have `font-style: italic`. 

Such default style values are encapsulated in the HTML tag.
And when we want to make web components, we also need to set such default style values 
for some of the key parameters particular for that web component.
In many ways, the host node represents the root element of the web component,
and so to give a web component/custom element a default style, we would need to specify the default style 
of the host node.

## Anti-pattern: `this.style` from inside a web component                 

From inside the web component, we can access the host node as `this`.
The most immediate approach to setting the default style of a web component as a whole, 
would therefore be to specify `this.style`.

But, this is an anti-pattern. The properties under `this.style` can and will be written to from
two other key locations: the lightDOM HTML template and the lightDOM JS context. Below you can see how:

```html
<script>  
class BoldAndBlue extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<slot></slot>";
    //this.style.fontWeight = "bold";                                //[1]
    //this.style.color = "blue";                                     //[1]
  }
  
  connectedCallback(){
    this.style.fontWeight = "bold";                                  //[1]
    this.style.color = "blue";                                       //[1]    
  }
}

customElements.define("bold-and-blue", BoldAndBlue);
</script>

<style>
#two {
  color: red;
}
div {
  display: inline;
}
</style>

<bold-and-blue id="one" style="color: red">one</bold-and-blue>        <!--2-->
<bold-and-blue id="two">two</bold-and-blue>                           <!--3-->
<div>I will stay inline.</div>                                        <!--3b-->

<script>
  setTimeout(function(){
    document.getElementById("one").style.color = undefined;           //[4]
  }, 1000);
</script>
```
1. During the construction of a custom element, you are not allowed to add attributes to host element.
   As properties under `this.style` will create a `style` attribute on the `host` node, 
   you have to wait until the `connectedCallback()` to add `this.style` properties.
2. But, when you create an element with a `style` attribute, 
   these settings will conflict as they are both writing to the same object: `this.style`.
3. When you specify the style of an element in the lightDOM's CSS rules, you want this style to
   override any default style of the web component. You can see the normal CSS to HTML behavior in 3b.
   However, if you specify the default style of a web component as `this.style`, 
   it will be interpreted as a style attribute of the host node itself and thus be given priority over
   style specified in CSS selector rules.
4. After construction, one of the initial values will have been overwritten and cannot be retrieved.
   Most often, it will be the template variant that loose, which is exactly what you don't want.
   However, the timing here *can* be more complex, cf. Pattern10_BatchedConstructorCallbacks.md.
   In any case, if you later remove the style property in the lightDOM as shown here, you
   will in any case loose any mention of the default value from the web component itself. Thus,
   the default value is not encapsulated in the web component, which is completely counterintuitive and
   counter-productive.

In short, `this.style` is not *my* style from the point of view of the web component.
If you use `this.style` to set the style of your web components, you will face several problems:
1. you cannot specify it in the constructor.
2. you likely will overwrite your users' explicit styling of your web component at startup.
3. when you change the style of your web component from the lightDOM, 
   you will loose all traces of the web components default style.

Therefore, it is better to specify custom, default styles of your web component from within its shadowDOM.
This will avoid all the three problems described above.
We therefore need another approach to specify the default style of the root web component:
HostWithStyle.

## References

 * 


 * `<li>` elements have a pseudo element `::before {content: bullet}` 
    (tomax check what code the bullet is).