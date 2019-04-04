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
      //Promise.resolve().then(()=>{      //trick add this second Prt if you wish to delay the batchedConstructorCallback post `slotchange` event in all instances.
      flushQue();
      isStarted = false;
      //});
    });
  }
}

const fn = function(el) {
  el.domBranchReady();
};

export function DOMBranchReadyMixin(Base){
  return class DOMBranchReadyMixin extends Base {
    constructor(){
      super();
      batchedConstructorCallback(fn, this);
    }
  }
}