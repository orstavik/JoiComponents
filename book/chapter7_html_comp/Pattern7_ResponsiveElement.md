# Pattern: ResponsiveElements

Most modern web apps and pages share one thing: responsiveness. 
With CSS media queries, a handful of HTML elements, 10 - 20 CSS rules and a little JS,
they make the app be manageable both on a small mobile screen or a larger desktop screen.

To make a web app responsive is not particularly hard. The problem with the resources above is that
they add detail and nuance to the code. These details and nuances gets mixed in and interwoven with
all the other details and nuances in the app, adding to the apps complexity which is eventually what
stops the app from growing more features and/or spawn bugs.

So, the problem of responsiveness is how to encapsulate its complexity into a neat unit that can
hide all the CSS, HTML and JS detail that in essence only concern this aspect of the app.

## Example: ResponsiveSidebar

ResponsiveSidebar is a classical responsive web page/app layout when the menu is placed in a:
 1. a LeftNav Bar on larger screens and 
 2. a TopNav Bar on smaller screens.

In this example we do not add or control the menu. We only set up the areas in which we can 
position the menu and content.

The ResponsiveSidebar is a HelicopterParentChild with one parent and two children:
 
 * `<page-root>` This is the invisible container for the entire structure.
 * `<page-menu>` This is area where the menu is.
 * `<page-content>` This is the area where the content is.
 
The `<page-root>` keeps track of its size using media queries (or alternatively AutoLayoutAttributes).
The trigger points for when the `<page-root>` alters its behavior are changed using CSS `::slotted(...)`
selectors that targets the `<page-menu>` and `<page-content>` elements directly.
The `<page-root>` hides all the elements that are not <page-menu>` and `<page-content>`, although
this can be overridden from the lightDOM.

When the elements are displayed, then the 

```html
<template>
  <style>
    /*mobile by default*/
    ::slotted(*) {
      display: none;
    }
    .sidebar {
      margin: 0;
      padding: 0;
      width: 200px;
      background-color: #f1f1f1;
      position: fixed;
      height: 100%;
      overflow: auto;
    }
    ::slotted(page-menu),
    ::slotted(page-content) {
      display: block;
      float: left;
      width: 100%;
    }
    ::slotted(page-menu) {
      height: var(--page-menu-height, 20px);
    }
    ::slotted(page-content) {
    }
    
    /*desktop*/
    @media screen and (min-width: 600px) {   /*the 600px will be replaced by another number when an attribute change*/
      ::slotted(*) {
        display: none;
      }
      ::slotted(page-menu),
      ::slotted(page-secondary),
      ::slotted(page-content) {
        display: block;
        float: left;
        min-height: 100%;
      }
      ::slotted(page-menu) {
        height: var(--page-menu-width, 20px);
      }
      ::slotted(page-content) {
      }
    } 
  </style>
</template>

<script >

class PageRoot extends HTML {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    const template = document.querySelector("template").content;
    this.shadowRoot.appendChild(template.cloneNode(true));
  }
}
class PageMenu extends HTML {
  
}
class PageContent extends HTML {
  
}

customElements.define("page-root", PageRoot);
customElements.define("page-menu", PageMenu);
customElements.define("page-content", PageContent);
</script>

<style>
page-menu{
  background-color: lightblue;
}
page-content {
  background-color: pink;
}
</style>

<page-root>
  <page-menu>menu</page-menu>
  <page-content>content</page-content>
</page-root>
```


## References

 * [MDN: `<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details)
