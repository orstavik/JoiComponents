# Pattern: InlineIframe

> The "i" in "iframe" stands for "inline". To name this pattern "inline-iframe" is thus the equivalent
of calling it "inline-inline-frame". I make this pun deliberately because I believe the `<iframe>` 
does not live up to its moniker.

The InlineIframe pattern combines all the previous Iframe patterns into one web component: 
`<inline-iframe>`. The `<inline-iframe>` extends all the attributes of the regular `<iframe>`
element, while in addition supporting the following attributes:
 * `base`
 * `inherit-css`
 * `included-resources`, and it will recognize `<iframe-script>`, `<iframe-style>`, and `<iframe-link>` 
 * `scrollsize`, (currently only supports overflowing the `right` and `bottom` boundaries) 
 * `transpose-event`, (currently only supports the `browse` event)
 
## WebComp: `<inline-iframe>`

```javascript
```

```html
<script>
</script>

<h1>Hello world!</h1>
<hr>
<overflow-iframe srcdoc="<a href='//bbc.com'>bbc.com</a><hr><a href='//google.com'>google.com</a>"></overflow-iframe>
<script>
  window.addEventListener("browse", function(e){
    console.log("browsing to: ", e);
  });
</script>

<!--
  This code is untested. I have only done superficial tests from within devtools in Chrome.
  The code should only work in Chrome, Safari, Firefox as template does not work in IE and Edge.
-->
```

## References

 * 