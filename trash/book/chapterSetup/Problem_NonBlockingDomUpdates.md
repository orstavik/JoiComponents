## Pattern: IdleDomTaskQue

## Problem: Blocking DOM updates

Sometimes a web app need to make changes to the DOM (**DOM updates**) 
that take a lot of time for the browser to complete.
The web app might for example:
* load many DOM elements at startup,
* add a lot of very small elements,
* rearrange many elements,
* delete some big elements, and/or
* perform some heavy calculations which require you to read and do small changes to the DOM.

Whatever the reason for your long-running DOM updates,
the browser needs to put all your other processes that works with the DOM *on hold*
until your DOM update is finished.
These other processes includes UI events such as scrolling, clicking and interacting with your page,
and the DOM updates therefore end up *blocking* and *freezing* the browser while they run.

## Example: SnailsRace450

SnailRace450 illustrates what blocking DOM updates look and feel like.
After the countdown, SnailRace450 loads 1000 snails that move from left to right.
The act of loading the snails is deliberately slowed down to 0-0.9ms, total 450ms.
During the countdown, the ui works and you can click the buttton.
But, during the 450ms that the snails are loaded onto the page, 
the browser will freeze/block for the entire period.

```html
<h1>3</h1>
<pre id="data"></pre>
<button onclick="alert('you have temporarily stopped the machine')">only works during countdown</button>

<style>
  @keyframes slimeRight {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(400px);
    }
  }

  div.snail {
    animation: 10s linear 0s 1 slimeRight;
    animation-fill-mode: forwards;
    margin: 10px;
    width: 20px;
    height: 8px;
    background: orange;
  }
</style>
<script>

  function makeSnail(i){
    for (var start = performance.now()+(i%10/10); performance.now() <= start;);    //[3]      
    var div = document.createElement("div");
    div.style.top = i*10 + "px";
    div.id = "snail" + i;
    div.innerText = i;
    div.classList.add("snail");
    document.querySelector("body").appendChild(div);                            //[4]
  }

  setTimeout(function(){document.querySelector("h1").innerText = 2}, 1000);     //[1]
  setTimeout(function(){document.querySelector("h1").innerText = 1}, 2000);
  setTimeout(function(){document.querySelector("h1").innerText = "go!"}, 3000);
  setTimeout(function(){
    var start = Date.now();                                                     //[2]
    for (var i = 0; i < 1000; i++)
      makeSnail(i);
    document.querySelector("#data").innerText = `freeze time ${Date.now()-start}`;
  }, 3030);
</script>
```                                                    
1. Countdown: 3..., 2..., 1..., go!!
2. Making and adding 10 snails. Recording the time it takes to make the snails.
3. Making each snail is delayed 100-900ms.
4. Adding the snail to the DOM. 
It is because we need to alter the DOM, 
that the ensuing solution takes the shape it does.

SnailRace4500's problem is that it:
* performs 1000 tasks (`makeSnail`) that  
* run as a unit 
* uses a total of 4500ms and
* blocks/freezes the UI.

## Solution: IdleDomTaskQue

To fix this problem we need to split the big, single process of 1000 `makeSnail`s into 
many smaller process of say 1-5 `makeSnail`s.
These chunks can then be run in parallel with the other browser tasks that for example
update/render the view and manage UI events.
By splitting the one big task into many smaller tasks,
we want to allow the browser to:
 * update the view incrementally and 
 * handle UI events as they occur.

To split tasks up like this, we need to use a que.
The browser has a few task ques available:
1. setTimeout
2. requestAnimationFrame
3. requestIdleCallback (native in Chrome and Firefox, needs polyfill elsewhere).

[requestIdleCallback]() sounds perfect. If we could add each makeSnail for each number to be called 
back when the browser is idle, that would be great. But.. 
This que is not suited for processes that updates the DOM .

we need to make a que that can manage the bundling of each individual call and 

```html
<script>
  var que = [];
  var duration = 4;
  
  function addToQue(makeSnailFun){
    que.push(makeSnailFun);
    if (que.length === 1)
      setTimeout(flushQue);
  }
  
  function flushQue(){
    var stop = performance.now() + duration;
    while (performance.now() < stop && que.length)
      que.shift()();
    if (que.length)
      setTimeout(flushQue);
  }
</script>

```