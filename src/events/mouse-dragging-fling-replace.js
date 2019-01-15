(function () {

  //pure filter function
  function filterOnAttribute(e, attributeName) {
    for (let el = e.target; el; el = el.parentNode) {
      if (!el.hasAttribute)
        return null;
      if (el.hasAttribute(attributeName))
        return el;
    }
    return null;
  }

  //dispatch event to replace default action
  function dispatchUnpreventableTrailingEvent(target, composedEvent, trigger, unpreventable) {
    if (unpreventable || !trigger.defaultPrevented)
      setTimeout(function(){target.dispatchEvent(composedEvent);}, 0);
  }

  //recording start
  let recorded = undefined;
  let cachedUserSelect = undefined;
  const mousemoveListener = e => onMousemove(e);
  const mouseupListener = e => onMouseup(e);
  const mouseoutListener = e => onMouseout(e);

  function startRecordingEvent(e, cancelMouseout) {
    recorded = [e];

    //capture the mouse pointer (akin to preventing the default action) start
    const bodyStyle = document.querySelector("body");
    cachedUserSelect = bodyStyle.userSelect;
    bodyStyle.userSelect = "none";
    //capture the mouse pointer (akin to preventing the default action) end

    window.addEventListener("mousemove", mousemoveListener, true);
    window.addEventListener("mouseup", mouseupListener, true);
    !cancelMouseout && window.addEventListener("mouseout", mouseoutListener, true);
  }

  function recordEvent(e) {
    recorded.push(e);
  }

  function stopRecordingEvent() {
    recorded = undefined;
    //release the captured mouse pointer start
    document.querySelector("body").style.userSelect = cachedUserSelect;
    cachedUserSelect = undefined;
    //release the captured mouse pointer end

    window.removeEventListener("mousemove", mousemoveListener, true);
    window.removeEventListener("mouseup", mouseupListener, true);
    window.removeEventListener("mouseout", mouseoutListener, true);   //always remove all potential listeners, regardless
  }

  //specific make event functions
  function makeDraggingEvent(name, trigger) {
    const composedEvent = new CustomEvent("dragging-" + name, {bubbles: true, composed: true});
    composedEvent.x = trigger.x;
    composedEvent.y = trigger.y;
    return composedEvent;
  }

  function makeFlingEvent(target, trigger) {
    const minDuration = target.hasAttribute("fling-duration") ? parseInt(target.getAttribute("fling-duration")) : 200;
    const flingTime = trigger.timeStamp - minDuration;
    const flingStart = findLastEventOlderThan(recorded, flingTime);
    if (!flingStart)
      return;
    const detail = flingDetails(trigger, flingStart);
    const minDistance = target.hasAttribute("fling-distance") ? parseInt(target.getAttribute("fling-distance")) : 50;
    if (detail.distDiag < minDistance)
      return;
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

  //specific listener functions
  function onMousedown(trigger) {
    //filter 1
    if (recorded) {
      const composedEvent = makeDraggingEvent("cancel", trigger);
      const target = recorded[0].target;
      stopRecordingEvent();
      return dispatchUnpreventableTrailingEvent(target, composedEvent);
    }
    //filter 2
    if (trigger.button !== 0)
      return;
    //filter 3
    const newTarget = filterOnAttribute(trigger, "draggable");
    if (!newTarget)
      return;

    trigger.preventDefault();

    //make event
    const composedEvent = makeDraggingEvent("start", trigger);

    //record
    startRecordingEvent(composedEvent, newTarget.hasAttribute("draggable-cancel-mouseout"));

    //dispatch event
    dispatchUnpreventableTrailingEvent(newTarget, composedEvent, trigger, true);
  }

  function onMousemove(trigger) {
    const newTarget = recorded[0].target;

    trigger.preventDefault();

    //make event
    const composedEvent = makeDraggingEvent("move", trigger);

    //record
    recorded.push(composedEvent);

    //dispatch event
    dispatchPriorEvent([newTarget, composedEvent, trigger], trigger, true);
  }

  function onMouseup(trigger) {
    const newTarget = recorded[0].target;

    trigger.preventDefault();

    //make events
    const stopEvent = makeDraggingEvent("stop", trigger);
    const flingEvent = makeFlingEvent(recorded[0].target, trigger);

    //record
    stopRecordingEvent();

    //dispatch event
    dispatchUnpreventableTrailingEvent(newTarget, stopEvent, trigger, true);
    dispatchUnpreventableTrailingEvent(newTarget, flingEvent, trigger, true);
  }

  function onMouseout(e) {
    //filter
    const eY = event.clientY;
    const eX = event.clientX;
    if(eY > 0 && eX > 0 && eX < window.innerWidth && eY < window.innerHeight)
      return;   //The mouse is not leaving the window

    e.preventDefault();

    const newTarget = recorded[0].target;

    //make events
    const cancelEvent = new CustomEvent("dragging-cancel", {bubbles: true, composed: true, triggerEvent: e});

    //record
    stopRecordingEvent();

    //dispatch event
    dispatchTrailingEvent(newTarget, cancelEvent, trigger, true);
  }

  window.addEventListener("mousedown", e => onMousedown(e));
})();