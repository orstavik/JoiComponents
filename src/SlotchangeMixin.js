/**
 * Acknowledgments
 *
 * Many thanks to Jan Miksovsky and the Elix project for input and inspiration.
 */

//pure function to find the last in toRun, that !hasRun
function findLastNotChecked(toRun, hasRun){
  for (let i = toRun.length - 1; i >= 0; i--){
    let el = toRun[i];
    if (hasRun.indexOf(el) < 0)
      return el;
  }
  return null;
}

//Ques for batched tasks
let startedQue =[];
let completed = [];
let isStarted = false;

//First, block flushing of the que until DCL, and on DCL, open the que and try to flush it
let dcl = document.readyState === "complete" || document.readyState === "loaded";
dcl || window.addEventListener("DOMContentLoaded", function() {dcl = true; flushQue();});

//process for flushing que
function flushQue(){
  //step 1: check that dcl is ready.
  if (!dcl) return;
  //step 2: all elements started has been processed? reset and end
  const fnel = findLastNotChecked(startedQue, completed);
  if (!fnel) {
    startedQue =[];
    completed = [];
    return;
  }
  //step 3: run function, add the element to the completed list, and run again with TCO
  fnel[0](fnel[1]);
  completed.push(fnel);
  flushQue();
}

function batchedConstructorCallback(fn, el){
  startedQue.push([fn,el]);
  if (!isStarted){
    isStarted = true;
    Promise.resolve().then(()=>{
      flushQue();
      isStarted = false;
    });
  }
}

/**
 * Filters away <slot> elements that are placed as grandchildren or lower of this custom element.
 */
function processSlotchange(e, el) {
  const path = e.composedPath();
  if (path[0].getRootNode() === el.shadowRoot){
    e.stopPropagation();
    el.slotCallback(path[0]);
    return;
  }
  for (let i = 0; i < path.length; i++) {
    if (path[i].tagName !== "SLOT")
      return;
    if (path[i].parentNode === el && path[i+1].getRootNode() === el.shadowRoot) {
      e.stopPropagation();
      el.slotCallback(path[i+1]);
      return;
    }
  }
}

const initFn = function(el){
  const slots = el.shadowRoot.querySelectorAll("slot");
  for (let i = 0; i< slots.length; i++)
    el.slotCallback(slots[i]);
  if (slots.length === 0)      //adds a slotCallback(undefined) if none is available
    el.slotCallback(undefined);
  Promise.resolve().then(()=>{
    el.shadowRoot.addEventListener("slotchange", e => processSlotchange(e, el));
  });
};

export function SlotchangeMixin(Base) {
  return class SlotchangeMixin extends Base {

    constructor() {
      super();
      batchedConstructorCallback(initFn, this);
    }
  }
}