# Pattern: BackstopMethod

A BackstopMethod is an attribute whose `attributeChangedCallback()` can be stopped in order
to prevent an infinite loop. The BackstopMethod is typically used in RecursiveElements and 
HelicopterParentChild.

To understand the problem, imagine a family on a car trip with three kids in the back seat.
One of the kids yells "shut up" to the other two kids. The other two kids both yell "shut up" back.
As the first kid receives *two* "shut up" having only yelled *one* himself, he of course gets offended 
and yells "shut up" back at the two other kids again. Four "shut ups" is more than the father in the
front seat will tolerate, so he joins in yelling "shut up" to all the three kids in the backseat.
Which again triggers the two original kids to react having only reacted, which is clearly within their
right, to the first "shut up". Being a buggy family, this spirals completely out of control triggering
a horrid sequence of events eventually resulting in a car crash as the driver gets too distracted by
the chorus of reciprocal family encouragement. 

In a family of related DOM nodes, we can think of `shut_up` as an attribute that can be added to
an element. Every time a `shut_up` attribute is added to a family member, that element will flip the
`shut_up` attribute on all its members too. The problem is: when does this cycle stop? And how to 
stop it?

## Implementation

The BackstopMethod pattern sets up custom JS methods on the custom element that allow others
(in the know) to flip one or more of its attributes while at the same time blocking any reaction to
the attribute change by the element.

To accomplish this task, the custom element implementing the BackstopMethod pattern:
1. creates an internal property for that specifies an attribute value,
2. every time the `attributeChangedCallback` for this attribute changes, it will check if its value
   is the same as this internal property. If it is, it will void this internal property and return.
   If it is not the same, then it will trigger.

If one family member wishes to flip an attribute on its other family members, without them responding
in kind, cyclically, it will use the BackstopMethod, and not `.setAttribute(...)` on its family members.

## Example: FamilyHarmony

```html
<script>
  class FamilyMember extends HTMLElement {

    constructor() {
      super();
      this.__shutUp = undefined;
    }

    static get observedAttributes() {
      return ["shut-up"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "shut-up") {
        if (newValue === this.__shutUp) {
          this.__shutUp = undefined;
          return;
        }
        for (let sib of this.parentNode.children) {
          if (sib !== this && sib.tagName && sib.tagName === "FAMILY-MEMBER")
            sib.shutUp(newValue);
        }
      }
    }

    shutUp(value) {              //This is the BackstopMethod
      this.__shutUp = value;
      value === null ?
        this.removeAttribute("shut-up") :
        this.setAttribute("shut-up", value);
    }
  }

  class FamilyHarmony extends HTMLElement {
  }

  customElements.define("family-harmony", FamilyHarmony);
  customElements.define("family-member", FamilyMember);
</script>

<style>
  [shut-up] {
    border: 4px solid red;
  }
</style>

<family-harmony>
  Give me: 
  <family-member>one</family-member>
  <family-member>two</family-member>
  <family-member>three</family-member>
  <family-member>four</family-member>
  <family-member>five</family-member>
</family-harmony>

<script>
  const familyMembers = document.querySelectorAll("family-member");

  setInterval(function () {
    const randomMember = familyMembers[Math.floor(Math.random() * familyMembers.length)];
    randomMember.hasAttribute("shut-up") ?
      randomMember.removeAttribute("shut-up") :
      randomMember.setAttribute("shut-up", "");
  }, 1000);
</script>
```

Note, the `attributeChangedCallback` is async, meaning that code can actually change an attribute
several times before the first queued callback is triggered. This means that using a simple boolean
value to skip the `attributeChangedCallback` will not work, as a second change might be made that 
should cause the reaction to run.

## References

 * 