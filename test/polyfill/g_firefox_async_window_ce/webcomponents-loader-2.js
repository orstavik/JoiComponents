/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function () {
  'use strict';

  function doYourThing() {

    window.WebComponents1.waitFor(() => {
      class MyElement extends HTMLElement {
        connectedCallback() {
          this.style.display = "block";
          this.style.width = "200px";
          this.style.height = "250px";
          this.style.borderRadius = "50%";
          this.style.backgroundColor = "orange";
        }
      }
      customElements.define("my-element", MyElement);
    });
  }


  window.WebComponents1 = {
    waitFor: function (waitFn) {
      if (!waitFn)
        return;
      if (!window.WebComponents1._waitingFunctions)
        return waitFn instanceof Function ? (waitFn(), customElements.upgrade(document)) : waitFn;
      window.WebComponents1._waitingFunctions.push(waitFn);
    },
    _waitingFunctions: [],
    flushWaitingFunctions: function () {
      var tmp = window.WebComponents1._waitingFunctions;
      window.WebComponents1._waitingFunctions = undefined;
      return Promise.all(tmp.map(function (fn) {
        return fn instanceof Function ? fn() : fn;
      }));
    }
  };

  window.WebComponents2 = {
    pauseCustomElementsPolyfill: function () {
      if (window.customElements && customElements.polyfillWrapFlushCallback)
        customElements.polyfillWrapFlushCallback(function () {});
    },
    restartCustomElementsPolyfill: function () {
      if (!window.customElements || !customElements.polyfillWrapFlushCallback)
        return;
      customElements.upgrade(document);
      customElements.polyfillWrapFlushCallback(function (originalFlushCallback) {
        originalFlushCallback();
      });
    }
  };

  window.WebComponents3 = {
    bootstrapTemplatePolyfill: function () {
      if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap)
        HTMLTemplateElement.bootstrap(window.document);
    }
  };

  var newScript = document.createElement('script');
  newScript.src = "https://rawgit.com/webcomponents/webcomponentsjs/master/bundles/webcomponents-sd-ce.js";
  doYourThing();                  //Ok, if the scope of the Class definition is within bounds
  newScript.addEventListener('load', function () {
    // doYourThing();                 //OK
    window.WebComponents2.pauseCustomElementsPolyfill();
    // doYourThing();              //OK
    window.WebComponents3.bootstrapTemplatePolyfill();
    window.WebComponents1.flushWaitingFunctions().then(function () {
      window.WebComponents2.restartCustomElementsPolyfill();
      // doYourThing();             //OK, after adding the customElements.upgrade(document);
    });
    // doYourThing();            //OK
  });
  document.head.append(newScript);
  // setTimeout(doYourThing, 1000);  //OK, after adding the customElements.upgrade(document);
})();