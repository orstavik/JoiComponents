# Mixin: LieFi

A typical problem for web apps working on a 3g/4g connection, is that the browser is registered as online, 
but the web connection is nonresponsive. We have a LieFi situation.

`LieFiMixin` listens to when an element is `online` and `offline`.
But, when the browser is registered as `online`, `LieFiMixin` also polls/pings a server
to see:
* if the ping can be completed and 
* how long the ping takes to complete.

Based on this polling, the `LieFiMixin` makes its own assumption about whether or not it *really is online*.
The `LieFiMixin` stores this value in its own .isOnline property.

The `LieFiMixin` uses several StaticSettings to control this polling:
```javascript
return {
  server: "serverAddress", //defaults to "https://google.com"
  threshold: 200, //ms response should be recevied within this timespan
  variance: 50 //% how much the response time is allowed to vary
}
```
liefiCallback() has the following signature
```javascript
function liefiCallback(online, timeSinceLastConnection, varianceOf5LastPolls) {
}
```

## Mixin: LieFi

The LieFiMixin remembers how long it was since the last connection. 
If the connection changes more often than once per 5 seconds, 
then it will not alert the user that it is connected, but that it has a weak connection.

The LieFiMixin also actively polls a micro network resource every 10seconds
to see if it can get it if the network is reportedly on.
How best to do this I don't know.

```javascript
const objs = [];

function triggerCallbacks(msg){
  for(let obj of objs){                    
    if (obj.isConnected)
      obj.onlineOfflineCallback(msg);
  }
}

const gettingOn = [];

if (window.isOnline)
  gettingOn.push(performance.now());

function con(){
  gettingOn.push(performance.now());
  if (gettingOn.length === 1)
    triggerCallbacks("on");
  let last = gettingOn[gettingOn.length-1];
  let secondToLast = gettingOn[gettingOn.length-2];
  if ((last-secondToLast)<5000)
    triggerCallbacks("flaky network");
  else
    triggerCallbacks("on");
}

function disCon(){
  for(let obj of objs){
    if (obj.isConnected)
      obj.onlineOfflineCallback();
  }
}

function pollNetwork(){
  //try to get a very small network resource. 
  // If it takes more than 10 seconds, then alert the callback that it takes too long.
  //  triggerCallbacks("liefi network" + duration);
}

window.addEventListener("online", con);
window.addEventListener("offline", discon);
window.setInterval(pollNetwork, 10000);

function LieFiMixin(Base){
  return class LieFiMixin extends Base {
    
    connectedCallback(){
      super.connectedCallback && super.connectedCallback();
      objs.push(this);
    }                     
    disconnectedCallback(){
      super.connectedCallback && super.connectedCallback();
      objs.remove(this); //todo does not exist of course
    }
  };
}
```


The liefiCallback(online, timeSinceLastConnection, varianceOf5LastPolls) tells the element:
 * triggers every time the internal liefi online value changes


## TODO
1. maybe this should not be a mixin, but a global event `liefi` that is dispatched on the window and 
that all elements can listen to? yes, this is likely true. I see no real use to keep this as a mixin.
The only point of having this as a mixin would be to have different settings for when something is online/offline 
depending on different element types, and not the app as a whole.. But I don't really see the use case here.

