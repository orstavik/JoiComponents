# HowTo: `requestIdleCallback`

> "Far from idleness being the root of all evil, it is rather the only true good. 
> Boredom is the root of all evil, and it is this which must be kept at a distance. 
> Idleness is not an evil; 
> indeed one may say that every human being who lacks a sense for idleness 
> proves that his consciousness has not yet been elevated to the level of the humane."
>
>   [Søren Kirkegard, "The Laughter Is on My Side", page 41-42](https://books.google.no/books?id=r-E9DwAAQBAJ&pg=PA42)  

## Pattern: WhileIdle

**WhileIdle** is a pattern for managing asynchronous tasks.
WhileIdle performs the tasks only when the browser is idle.
To run tasks when the browser is idle, WhileIdle adds each task to a que that 
is gradually emptied when the browser is not preoccupied with other tasks.
The process of gradually emptying the WhileIdle que is called "whidle"
("whidle" is short for "**wh**ile **idle**" and alludes to the word "whittle").

```javascript
const que = [];             //[1]

function addToQue(fun) {    //[2]
  que.push(fun);
  if (que.length === 1)     //[3]
    setTimeout(whidle, 1);  //[4]
}

function whidle() {
  if (que.length === 0)     //[5]
    return;
  const fun = que.shift();  //[6]
  fun();
  setTimeout(whidle, 0);    //[7]
}
```
1. Set up the `que` as an array to hold the WhileIdle tasks.
2. Receive tasks to be queued as function objects `fun`.
3. When the first `fun` task is added to the `que`,
the `whidle` process is activated.
4. To ensure that the `whidle` process is first started when the browser first time becomes idle,
the task is added to the `setTimeout` que with a slight delay of 1ms.
The slight delay should ensure that all browsers will have rendered *before* the `whidle` process starts.
5. The `whidle` process is self-regulated. When the WhileIdle `que` is emptied, the  `whidle` stops.
6. When the `whidle` is triggered, it takes a `fun` task from the WhileIdle `que` and runs it.
In this basic implementationin the order "first in, first out".
7. To give the browser the time to process rendering and UI tasks, 
the `whidle` places itself in the `setTimeout` task que to run its next task.

## Using `setTimeout` to find idle time
The browser performs many different tasks at the same time. 
These tasks can be viewed as coming from a group of different task ques: 
 * render the view (once every 16ms),
 * UI events,
 * OS events, 
 * `setTimeout` callbacks,
 * `requestAnimationFrame` callbacks,
 * and more.

Different browsers use different algorithms to control and prioritize *which task* is picked out 
from *which task que* when. Therefore, to find out exactly where and how to run 

To find out when the browser has time to run an idle task might 
The browser controls when new tasks are dispatched from `setTimeout` task que.
Different browsers employ different algorithms to prioritize tasks in the `setTimeout` que 
against other tasks such as rendering and UI triggered events efficiently.
This makes it difficult to precisely assess when tasks added in the `setTimeout` que will be executed 
and if and how such tasks will behave will conflict with both rendering and .
but all browsers will choose to delay the setTimeout que to let the browser render the page or 


A primitive implementation of a WhileIdle que simply adds functions to an array, and
while the array has content
                                                           
## `requestIdleCallback()`



## WhileIdle Mixin.

When WhileIdle is used to control the setup of custom elements, 
it establishes some guidelines for how both individual elements should work 
(manifested in a WhileIdle mixin), and how elements in a branch should behave.
The 
as 

To perform tasks in this manner is 

at the first opportunity when the browser is idle.

Often you want to run a
In front end development, this means to It means to do a task only when the browser has resources to perform them.

## References
 * [Google: requestIdleCallback](https://developers.google.com/web/updates/2015/08/using-requestidlecallback)
 * [MDN: requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Background_Tasks_API)
 * [MDN: Background_Tasks_API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Tasks_API)
 * [Edge: requestIdleCallback](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/requestidlecallback/)
 * [Safari: requestIdleCallback](https://webkit.org/status/#?search=requestidlecallback)