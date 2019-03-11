/**
 * SetupMixin
 *
 * SetupMixin adds a reactive setupCallback() method to an element.
 * The setupCallback() is a method for:
 * 1. setting default attribute values,
 * 2. populating the shadowDOM, and/or
 * 3. other heavier setup tasks that the browser might want to delay.
 *
 * The constructor() can be used to establish the properties of the element,
 * but as the constructor is often called `post-instantiation` anyway,
 * you might want to skip the constructor entirely, and only use the setupCallback() instead.
 *
 * Comment: Maybe the constructor behaviour should be different.
 * Maybe the attributes should be populated into HTMLElements before the constructor is called.
 * But in any case, you often might want to delay the constructor of the element, so
 * this is not really that important.
 *
 * The setupCallback() can be triggered at the following times:
 * 1. "firstConnected" (default): just before the first connectedCallback(),
 * 2. <number> such as 40 (ms), the que of setupCallbacks are run asap.
 * But if many setupCallbacks are added at the same time, the process of running setupCallback is
 * only allowed to run up until the <number> of ms after the start of the requestAnimationFrame callbacks started at a time.
 * After <number> of ms the flushing of waiting setupCallback()s are temporarily halted and
 * queued in a new requestAnimationFrame callback.
 * This enables the browser to render the view and process other events before proceeding, thus
 * un-blocking the browser.
 * 3. "blocking", (run asap at the first available requestAnimationFrame callback),
 * "blocking" is implemented by adding a very high number as its value (ie. 666666).
 * 4. "enterView", when the element first enters the viewport, using the IntersectionObserver API,
 * if the browser does not support the IntersectionObserver API, the Mixin falls back to the default "firstConnected"
 * behavior.
 * 5. "domContentLoaded". Run when the domContentLoaded or in the first rAF if the page has already finished loading.
 *
 * ### Priority for <number> and "blocking" setupCallback()s:
 *
 * There is a single que for running all setupCallback() methods on all types of elements.
 * This que is always sorted and prioritized so that elements with the highest ms priority are always first in line.
 * If two elements have identical priority, it is first in first out.
 * The "blocking" setupCallback are queued in the same que, they are simply given a very high number (ie. 666666 (6x6)).
 *
 * ## Race between connectedCallback() and setupCallback()
 *
 * It is not uncommon to do tasks in connectedCallback() depend on setupCallback().
 * For example, setupCallback() might set up a shadowDOM, and
 * then connectedCallback() binds an event listener to an element in that shadowDOM.
 * However, if the execution of setupCallback() is scheduled to be run when "domContentLoaded",
 * and the element is connected to the DOM while the page is loading and before "domContentLoaded"
 * (a very common scenario), then either:
 *
 * 1. setupCallback() must be performed immediately before the first connectedCallback(), as in "firstConnected" state, or
 * 2. the execution of connectedCallback() must be rescheduled to run after the delayed setupCallback() has run.
 *
 * To delay connectedCallback() require two steps:
 * 1. In connectedCallback(): at the very beginning, add a check to see if this.isSetup is true.
 * If it is not, then cancel the connectedCallback() at this time.
 * 2. In setupCallback(): at the very end, add a check to see if the element is connected.
 * If it is, then run connectedCallback() that we had canceled in the previous step.
 *
 * The code looks like this:

 setupCallback(){
  ...
  this.isConnected && this.connectedCallback();
}

 connectedCallback(){
  if (!this.isSetup) return;
  ...
}

 *
 */


/**
 * setupIntersectionObserver monitors a list of target elements and
 * calls setupCallback on the element the first time they enter the view.
 */
const setupIntersectionObserver = window.IntersectionObserver ?
  new IntersectionObserver(entries => {
    for (let entry of entries) {
      if (entry.isIntersecting) {
        entry.target.setupCallback();
        setupIntersectionObserver.unobserve(entry.target);
      }
    }
  }) : undefined;

/**
 * setupCallback
 */
const domContetLoadedQue = [];  //que for elements on which setupCallback will be called
const queElems = [];            //que for elements on which setupCallback will be called
const queTimes = [];            //que for the priority in ms for these elements

function addToDomContetLoadedQue(el, ms){
  if (document.readyState !== "loading")
    return addToQue(el, ms);
  domContetLoadedQue.push(el);
  if (domContetLoadedQue.length === 1)
    document.addEventListener("domContentLoaded", flushDomContentLoadedQue);
}

function flushDomContentLoadedQue(){
  for (var i = 0; i < domContetLoadedQue.length; i++)
    domContetLoadedQue[i].setupCallback();
}

function addToQue(el, ms) {
  let pos = 0;                    //find the position of the el in the que based on its time priority
  while (pos < queTimes.length && ms <= queTimes[pos])    //if the two ms priorities are identical, it is FIFO ordered.
    pos++;
  queElems.splice(pos, 0, el);    //add the el
  queTimes.splice(pos, 0, ms);    //and the time priority in the que
  if (queElems.length === 1)      //if this is the first el in the que, start the flushing
    requestAnimationFrame(flushQue);
}

function flushQue(startTime) {
  while (queElems.length) {                 //while there are more elements in the prioritized que
    let endTime = queTimes[0] + startTime;  //look at the priority time of the first in que
    if (endTime <= performance.now())       //test that the currentTime has not surpassed the priority for the element
      return requestAnimationFrame(flushQue); //if there is not enough time in this round, then do more flushQue next rAF
    queElems.shift().setupCallback();         //if there is more time this round, then remove the element from the que and run setupCallback() on it.
    queTimes.shift();
  }
}

const first = Symbol("first");

export const SetupMixin = function (Base) {
  return class SetupMixin extends Base {

    static get setupSetting() {
      return "firstConnected"; //or: <number> ms, "blocking", "enterView"
    }

    constructor() {
      super();
      let type = this.constructor.setupSetting;
      if (type === "enterView" && !window.IntersectionObserver)
        type = "firstConnected";
      this[first] = type !== "firstConnected";
      if (!this[first])
        return;
      if (type === "enterView")
        return setupIntersectionObserver.observe(this);
      if (type === "domContentLoaded")
        return addToDomContetLoadedQue(this, 666666);
      if (type === "immediate")
        return addToQue(this, 666666);
      if (type instanceof Number)
        return addToQue(this, type);
      throw new TypeError("static get setupSetting must return either 'firstConnected', 'domContentLoaded', 'blocking', 'enterView' or a Number. Illegal value: " + type);
    }

    connectedCallback() {
      this[first] || ((this[first] = true) && this.setupCallback());
      if (super.connectedCallback) super.connectedCallback();
    }
  }
};

//* problem. The "how much time do I have available each frame" guessing game.
//* problem. I don't know how much time the render takes!! I never know how much time the render takes.
//* problem. The render takes different amount of time from time to time, so it is hard to evaluate anyways.
//* problem. this means that to guess the idle time is a guessing game. A constant guessing game.

// guess: 1. assumption each frame takes 16ms. This is true for 60fps.
//                      but now things are starting to come in 100fps and 120fps...
//                      So this timespace is not good.. But.. Maybe since 60fps is ok when we have setupTasks back-logged.
//                      maybe to say that 60fps is good enough.
//                      but again, maybe I should aim for the smallest frame..

// guess: 2. render+ui  the time render+ui events takes will vary greatly.
//                      Sometimes, no render happens. It can be for example 0-4ms?
//                      Sometimes, only render happens. 4-7ms depending on the browser and processor etc?
//                      Sometimes, both render and ui events happens. scrolling. 7-16ms depending on the browser and processor etc?

// guess: 3. transition the user can suddenly, from one frame to the next, start ui events.
//                      some of the setupTasks can be very heavy for the render, thus making the render longer.
//                      some of the setupTasks can be very light for the render, thus making the render short.

// plan a: +2-2         go up up up until break, then down down down until ok, then up again

// plan b:              do the +2-2 logic.
//                      but every time the browser goes up, you add the number to an yes list.
//                      and every time the browser goes down, you add the number to an no list.
//                      the yes and no lists are then gradually populated.
//                      the yes and no lists has an average.
//                      when making a new guesstimate, you go for halfway between the yes and the no averages.
//                      this makes for a very stable guesstimator.
//                      But this guesstimator will also be very slow to respond to changes both in gained and reduced resources.

//plan b+               what to do when the 

// plan c:              similar to plan b.
//                      it uses averages going upwards. but instead of doing averages, do the last success and last failure only.
//                      If the user starts ui events, this will make the algorithm browser is much faster at correcting
//                      the yes and no lists are then gradually populated.
//                      the yes and no lists has an average.
//                      when making a new guesstimate, you go for halfway between the yes and the no averages.

// plan c:              do the halfway between /2-2 logic.
//                      but every time the browser goes up, you add the number to an yes list.
//                      and every time the browser goes down, you add the number to an no list.
//                      the yes and no lists are then gradually populated.
//                      the yes and no lists has an average.
//                      when making a new guesstimate, you go for halfway between the yes and the no averages.


//1. The whidle needs to end every time to let the render work.
//   So 6ms(?) out of every 16ms we prioritize for update of the screen.
//   But, it might be less than 6ms, so we might want to aim for 4.
//   Maybe we should run a frame just to meassure how short the frametime CAN be..

//2. The whidle should try to maximize the time it spends within each frame.

//3. If the whidle uses more time than it has, the result will be that the frame will take too long.

//4.