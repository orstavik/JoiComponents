# Route 2: PopstateMixin for SPA

```
The popstate event is fired when the active history entry changes. 
If the history entry being activated was created by a call to history.pushState() 
or was affected by a call to history.replaceState(), the popstate event's state 
property contains a copy of the history entry's state object.

Note that just calling history.pushState() or history.replaceState() won't 
trigger a popstate event. The popstate event will be triggered by doing a 
browser action such as a click on the back or forward button (or calling 
history.back() or history.forward() in JavaScript).


```

## Mixin: Popstate

```javascript
const now = Symbol("now");
const then = Symbol("then");

const PopstateMixin = function(Base){
  return class PopstateMixin extends Base {

    constructor() {
      super();
      this._listener = ()=> this.getValue();
      this[now] = undefined;
    }
    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      window.addEventListener("popstate", this._listener);
      this.getValue();                                        //[1]
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      window.removeEventListener("popstate", this._listener);
    }
    
    getValue() {
      let then = this[now];
      this[now] = this.history.blabla(); //todo               //[3]
      if (then !== this[now])                                 //[2]
        this.popstateCallback(this[now], then);
    }
  }
};
```
1. Browsers tend to handle the popstate event differently on page load. 
Chrome (prior to v34) and Safari always emit a popstate event on page load, but Firefox doesn't.
To harmonize the popstate event on page load, the popstateCallback() is 
always triggered on `connectedCallback()`.

2. If no change has happened from last time a `popstateCallback(now, then)` was triggered,
then `popstateCallback(now, then)` is not triggered.

3. The `popstateCallback(now, then)` used the xyz of the `window.history` 
to fill the `now` and `then` arguments.

## Example: SPA with a popstateCallback()..

## coming in the future
The route:
3. MPA with full-link routing, 
requires sw.js or active use of localstorage or similar.
location history.
4. full-link routing with parsing. 
The parsing requires essentially a regex query.
This will then parse the query into several parts that are accessible in the routeChangedCallback(parsedRouteObj).
This can be done in many ways. 
The Mixin requires a setting, that it will parse the route based on.
And then find the part that it is interested in as an object. The sub route. The main route.
But this is not really something that I would prefer.
I would much rather make a series of static functions that the user himself employs when the route changes.
The route mixin should help fix the history and normalize everything. not parse..
Question. At what time to introduce adding settings? around here??

5. using EnterViewMixin to trigger hashChanges
reverse routing. Create user interactions that automatically trigger or updates the route.

6. Setting up a custom router. 
this one can find invalid routes and redirect.
should monitor and update the location and history, and 
then fire a routeChangedEvent that components can listen too?
That dispatches custom route-changed events from itself that bubble.
Set up declerative rules, use the server-side rules as basis.
Add a RouteFunctionalMixin that can listen for this particular component and receive its route-changed events?
(a simple mixin that listen for "route-changed" and that converts this to a reactive callback.)

X. route redirection does not have to be cooked up into the normal route parsing.
These two things can be separate. You can have one entity whose only 
purpose it is to redirect when an illegal route is found, and then keep that separate.


HashChangedMixin event is fired when the fragment identifier of the URL has changed. 
Mixin is based on hashchange event which is fired every time when the fragment identifier of the URL has changed 
(the part of the URL that follows the # symbol, including the # symbol). 
The purpose of this HashChangedMixin is to provide hashChangedCallback() 
that is triggered every time when the fragment identifier of the URL has changed. 
The hashChangedCallback() include two parameters: (newHash, oldHash). 
newHash - the hash value (#value) to changes oldHash - after changes. 
The resulting values can be used without processing (they are not include # symbol)

## References 
1. [MDN: `popstate` event](https://developer.mozilla.org/en-US/docs/Web/Events/popstate)
2. [MDN: `window.history`](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
