# Test: StyleCallback

We can test the performance cost of the `styleCallback(...)` method this way:
We set up two web components which both implement the same `styleCallback(...)` method.
One test case uses the `StyleCallbackMixin` and specify the parameters of the `styleCallback(...)` as
custom CSS values assigned to the web component via CSS rules and properties.
The other test case remove the `StyleCallbackMixin` entirely and use other JS methods to trigger the
`styleCallback(...)` with the same parameters, without calling `getComputedStyle(..)` as much as it can.

The two tests cannot run in the same `window` (ie. no `<iframe>`s) since they share the same process.
Such sharing of a process can occur between browser tabs as well. The best way to split them is therefore
to run them one after the other and monitor performance of each one manually.

A simple way to monitor performance is to stress test it. Find tests that causes the browser 
to lower its frames per second (fps) below its maximum potential. If the test run at around 60 fps
with ten elements, then increase the number of element so that the fps drops to between 5 and 45.

To test performance, the `checkStyleCallbackErrors()` should not be used. Sure, you can test the
performance of this method too, if you want, but it is besides the point for the performance of 
`styleCallback(...)` in production, as StyleCallbackErrors should be dropped in production (the default 
mode of the StyleCallback pattern).

Factors that are likely to impact the performance of `styleCallback(...)` is:
1. the number of elements that use it,
2. hierarchy between these elements,
3. if `styleCallback(...)` alters the input parameters of another `styleCallback(...)`
   of a contained element, and
4. if `styleCallback(...)` adds another element with a `styleCallback(...)` to its shadowDOM.

## Demo: 100 `<blue-blue>`

This test adds 100 `<blue-blue>` elements that calculate the style of two inner
custom CSS properties `--light-color` and `--dark-color` based on an input `--color` passed to a 
`styleCallback(propName, oldValue, newValue)` method.
 * The StyleCallbackMixin test sets the colors in CSS, and then mutates the order of the elements so as 
to apply new `--color` values to each element which then triggers the `styleCallback(...)` method.
 * The NoMixin test does the same thing, but instead of specifying the `--color` property in CSS, 
it uses JS operations to calculate the same color value and then trigger the `styleCallback(...)` 
method directly.

## PerformanceTest.html
```html
<h3 id="fps">FPS: ?</h3>
<ul>
  <li>Number of elements: <input type="text" id="count">100</li>
  <li><a href="#100BlueBlueDashDashColor.html">100 BlueBlue with --color and StyleCallbackMixin</a></li>
  <li><a href="#100BlueBlueNoStyleCallback.html">100 BlueBlue with native JS and NoMixin</a></li>
</ul>
<iframe id="test" src="" frameborder="0"></iframe>
<script>
  const times = [];
  let fpsEl = document.querySelector("#fps");

  function refreshLoop() {
    window.requestAnimationFrame(() => {
      const now = performance.now();
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }
      times.push(now);
      fpsEl.innerText = "FPS: " + times.length;
      refreshLoop();
    });
  }

  refreshLoop();
  
  function test(){
    var iframe = document.querySelector("iframe");
    var count = document.querySelector("#count").value;
    var filename = location.hash.substr(1);
    iframe.setAttribute("src", "./"+filename + "#" + count);
  }
  window.addEventListener("hashchange", test);
</script>
```

## References

 * 
