# Web component anti-patterns

1. Don't use `this.innerHTML`.
   Custom elements have a host element. 
   The host element exists in an HTML `document` *outside* the custom element.
   To reach *outside* of the custom element and change the `document` on the outside 
   is likely going to cause conflicts, code in one element/document that changes properties
   of another element/document with negative consequences.
   
   `this` inside a custom element refers to the host element.
   `this.innerHTML` therefore changes the ***lightDOM*** children of the element.
   So, in reuseable custom elements, `this.innerHTML` should not be used.
   
   Alternative: `this.shadowRoot.innerHTML`.
   
2. Don't use `this.style`.
   The same principles that applied to `innerHTML` and changing the **lightDOM** children 
   of the host element applies to style.
   Changing such properties on an element is likely going to cause conflicts.
   
   Alternative: add a `<style>` element inside the **shadowDOM** of a custom element.
   
3. Don't use `this.classList.add`

   The same principles that applied to `this.innerHTML`, `this.style` 
   and changing the **lightDOM** children of the host element applies to CSS classes.
   Changing such properties on an element is likely going to cause conflicts.
   
   Alternative: set HTML attributes instead of CSS classes on the element. 
   HTML attributes are intended as an element state conveyor between the inside and outside of HTML elements.
   
4. "TypeError: Illegal constructor"
   
   You forgot to add customElements.define() of your new subclass of HTMLElement.