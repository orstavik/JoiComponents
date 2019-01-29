(function () {
  //utilities
  function captureEvent(e, stopProp) {
    e.preventDefault();
    stopProp && e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
  }

  function filterOnAttribute(e, attributeName) {
    for (let el = e.target; el; el = el.parentNode) {
      if (!el.hasAttribute)
        return null;
      if (el.hasAttribute(attributeName))
        return el;
    }
    return null;
  }

  function dispatchPriorEvent(target, composedEvent, trigger) {
    // if (!composedEvent || !target)   //todo remove this redundant check? should always be done at the level up?
    //   return;
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  //custom make events
  function makeDraggingEvent(name, trigger) {
    const composedEvent = new CustomEvent("dragging-" + name, {bubbles: true, composed: true});
    composedEvent.x = trigger.x;
    composedEvent.y = trigger.y;
    return composedEvent;
  }

  function makeFlingEvent(trigger, sequence) {
    const flingTime = trigger.timeStamp - sequence.flingDuration;
    const flingStart = findLastEventOlderThan(sequence.recorded, flingTime);
    if (!flingStart)
      return null;
    const detail = flingDetails(trigger, flingStart);
    if (detail.distDiag < sequence.flingDistance)
      return null;
    detail.angle = flingAngle(detail.distX, detail.distY);
    return new CustomEvent("fling", {bubbles: true, composed: true, detail});
  }

  function findLastEventOlderThan(events, timeTest) {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].timeStamp < timeTest)
        return events[i];
    }
    return null;
  }

  function flingDetails(flingEnd, flingStart) {
    const distX = flingEnd.x - flingStart.x;
    const distY = flingEnd.y - flingStart.y;
    const distDiag = Math.sqrt(distX * distX + distY * distY);
    const durationMs = flingEnd.timeStamp - flingStart.timeStamp;
    return {distX, distY, distDiag, durationMs};
  }

  function flingAngle(x = 0, y = 0) {
    return ((Math.atan2(y, -x) * 180 / Math.PI) + 270) % 360;
  }

  //custom sequence
  let globalSequence;
  const mousemoveListener = e => onMousemove(e);
  const mouseupListener = e => onMouseup(e);
  const mouseoutListener = e => onMouseout(e);

  function startSequence(target, e) {
    const body = document.querySelector("body");
    const sequence = {
      target,
      cancelMouseout: target.hasAttribute("draggable-cancel-mouseout"),
      flingDuration: parseInt(target.getAttribute("fling-duration")) || 50,
      flingDistance: parseInt(target.getAttribute("fling-distance")) || 150,
      recorded: [e],
      userSelectStart: body.style.userSelect
    };
    body.style.userSelect = "none";
    window.addEventListener("mousemove", mousemoveListener, true);
    window.addEventListener("mouseup", mouseupListener, true);
    !sequence.cancelMouseout && window.addEventListener("mouseout", mouseoutListener, true);
    return sequence;
  }

  function updateSequence(sequence, e) {
    sequence.recorded.push(e);
    return sequence;
  }

  function stopSequence() {
    //release target and event type start
    //always remove all potential listeners, regardless
    document.querySelector("body").style.userSelect = globalSequence.userSelectStart;
    window.removeEventListener("mousemove", mousemoveListener, true);
    window.removeEventListener("mouseup", mouseupListener, true);
    window.removeEventListener("mouseout", mouseoutListener, true);
    return undefined;
  }

  //custom listeners

  function onMousedown(trigger) {
    //filter 1
    if (globalSequence){
      const cancelEvent = makeDraggingEvent("cancel", trigger);
      const target = globalSequence.target;
      globalSequence = stopSequence();
      dispatchPriorEvent(target, cancelEvent, trigger);
      return;
    }
    //filter 2
    if (trigger.button !== 0)
      return;
    //filter 3
    const target = filterOnAttribute(trigger, "draggable");
    if (!target)
      return;

    const composedEvent = makeDraggingEvent("start", trigger);
    captureEvent(trigger, false);
    globalSequence = startSequence(target, composedEvent);
    dispatchPriorEvent(target, composedEvent, trigger);
  }

  function onMousemove(trigger) {
    if (1 !== (trigger.buttons !== undefined ? trigger.buttons : trigger.nativeEvent.which)) {
      const cancelEvent = makeDraggingEvent("cancel", trigger);
      const target = globalSequence.target;
      globalSequence = stopSequence();
      dispatchPriorEvent(target, cancelEvent, trigger);
      return;
    }
    const composedEvent = makeDraggingEvent("move", trigger);
    captureEvent(trigger, false);
    globalSequence = updateSequence(globalSequence, composedEvent);
    dispatchPriorEvent(globalSequence.target, composedEvent, trigger);
  }

  function onMouseup(trigger) {
    const stopEvent = makeDraggingEvent("stop", trigger);
    const flingEvent = makeFlingEvent(trigger, globalSequence);
    captureEvent(trigger, false);
    const target = globalSequence.target;
    globalSequence = stopSequence();
    dispatchPriorEvent(target, stopEvent, trigger);
    if (flingEvent)
      dispatchPriorEvent(target, flingEvent, trigger);
  }

  function onMouseout(trigger) {
    //filter to only trigger on the mouse leaving the window
    if (trigger.clientY > 0 && trigger.clientX > 0 && trigger.clientX < window.innerWidth && trigger.clientY < window.innerHeight)
      return;
    //captureEvent(trigger, false);
    const cancelEvent = makeDraggingEvent("cancel", trigger);
    const target = globalSequence.target;
    globalSequence = stopSequence();
    dispatchPriorEvent(target, cancelEvent, trigger);
  }

  window.addEventListener("mousedown", e => onMousedown(e));
})();