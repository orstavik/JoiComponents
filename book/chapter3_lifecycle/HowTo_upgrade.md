# HowTo: `upgrade`

## What is upgrade?

See the spec for good quote.
The calling of the custom element's constructor on an instance of an HTMLElement 
that has already been created for that element.
The calling of a constructor on an already constructed element.

## What happens during an upgrade?

All the callbacks of the element are run, and slotchange events are queued.
Check if MutationObserver is checked at this point too, I think so

## When does upgrade happen?

The `upgrade` is a tricky beast. The upgrade happens at two times:
1. First a custom element is added to the DOM, and then after that the custom element definition is registered.
Then the browser will call the constructor on the element already connected, but not yet recognized.
2. The element is taken from within a `template` and then added to the DOM. Or just taken out of a template.

Todo make an example for this.
Test when the constructor is run when an element is taken out of a template.
is it when I make a reference to it?
is it when i call a custom method on it?
is it when I add it to the dom?

```html
<my-el id="a">.</my-el>

<script>
console.log("**before def**");  
class MyEl extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML="<slot></slot>";
    this.shadowRoot.addEventListener("slotchange", e => this.slotchanged(e));
  }
  connectedCallback(){
    console.log("con " + this.id)
    Promise.resolve().then(()=> this.afterConnectedCallback());
  }
  slotchanged(e){
    console.log("slot " + this.id)
  }
  afterConnectedCallback(){
    console.log("postCon " + this.id)
  }
}
customElements.define("my-el", MyEl);
console.log("**immediately after def**");
Promise.resolve().then(()=>console.log("**after def microtask end**"));
</script>              

<my-el id="b">.</my-el>
```

```
**before def**
con a
**immediately after def**
slot a
postCon a
**after def microtask end**
con b
postCon b
slot b
```
This shows that slotchange are added by the upgrade process itself, before the upgrade triggers the connectedCallback().

## How to detect if constructor invocation is an upgrade or regular?

Or, at this time the custom element constructor will call.
But when the constructor is now called, it will have all the children and attributes and `isConnected` set.
But.. none of these markers are safe to find out if a constructor call is an `upgrade` or regular.
Is it safe from within the constructor? I think not..

But, if we can, then this is really super, as we then could make an UpgradeMixin that gives us an `upgradeCallback()`?!)
I really don't think there is any way to 

### `postCon` as alternative to `upgrade`?
### `FirstConnectedCallback` as alternative to `upgrade`?

This is also bad, as 


Whenever the element is upgraded, the 

## References
 * [whatwg: upgrade](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-upgrades-examples)