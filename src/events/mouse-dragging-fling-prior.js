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

  //dispatch prior
  function dispatchPriorEvent([el, linkClick, e]) {
    if (!linkClick)
      return;
    linkClick.preventDefault = function () {
      e.preventDefault();
      e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
    };
    linkClick.trailingEvent = e;
    return el.dispatchEvent(linkClick);
  }

  //recording start
  let recorded = undefined;
  const mousemoveListener = e => onMousemove(e);
  const mouseupListener = e => onMouseup(e);
  const mouseoutListener = e => onMouseout(e);

  function startRecordingEvent(e, cancelMouseout) {
    recorded = [e];
    window.addEventListener("mousemove", mousemoveListener, true);
    window.addEventListener("mouseup", mouseupListener, true);
    !cancelMouseout && window.addEventListener("mouseout", mouseoutListener, true);
  }

  function recordEvent(e) {
    recorded.push(e);
  }

  function stopRecordingEvent() {
    recorded = undefined;
    window.removeEventListener("mousemove", mousemoveListener, true);
    window.removeEventListener("mouseup", mouseupListener, true);
    window.removeEventListener("mouseout", mouseoutListener, true);   //always remove all potential listeners, regardless
  }

  //recording stop

  //capture caching
  let cachedUserSelect = undefined;

  function makeDraggingEvent(name, trigger) {
    const composedEvent = new CustomEvent("dragging-" + name, {bubbles: true, composed: true});
    composedEvent.x = trigger.x;
    composedEvent.y = trigger.y;
    return composedEvent;
  }

//specific listener functions
  function onMousedown(trigger) {
    //filter 1
    if (recorded) {
      const composedEvent = makeDraggingEvent("cancel", trigger);
      const data = [recorded[0].target, composedEvent, trigger];
      stopRecordingEvent();
      return dispatchPriorEvent(data);
    }
    //filter 2
    if (trigger.button !== 0)
      return;
    //filter 3
    const newTarget = filterOnAttribute(trigger, "draggable");
    if (!newTarget)
      return;

    //capture the mouse pointer (ie. prevent the default action)
    const bodyStyle = document.querySelector("body");
    cachedUserSelect = bodyStyle.userSelect;
    bodyStyle.userSelect = "none";
    trigger.preventDefault();

    //make event
    const composedEvent = makeDraggingEvent("start", trigger);

    //record
    startRecordingEvent(composedEvent, newTarget.hasAttribute("draggable-cancel-mouseout"));

    //dispatch event
    dispatchPriorEvent([newTarget, composedEvent, trigger]);
  }

  function onMousemove(trigger) {
    const newTarget = recorded[0].target;

    //capture the mouse pointer (ie. prevent the default action)
    trigger.preventDefault();

    //make event
    const composedEvent = makeDraggingEvent("move", trigger);

    //record
    recorded.push(composedEvent);

    //dispatch event
    dispatchPriorEvent([newTarget, composedEvent, trigger]);
  }

  function onMouseup(trigger) {
    const newTarget = recorded[0].target;

    //capture the mouse pointer (ie. prevent the default action)
    trigger.preventDefault();

    //make events
    const stopEvent = makeDraggingEvent("stop", trigger);
    const flingEvent = makeFlingEvent(recorded[0].target, trigger);

    //record
    stopRecordingEvent();

    //dispatch event
    dispatchPriorEvent([newTarget, stopEvent, trigger]);
    dispatchPriorEvent([newTarget, flingEvent, trigger]);
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

  function onMouseout(e) {
    const eY = event.clientY;
    const eX = event.clientX;
    if(eY > 0 && eX > 0 && eX < window.innerWidth && eY < window.innerHeight)
      return;   //The mouse is not leaving the window

    const newTarget = recorded[0].target;

    //capture the mouse pointer (ie. prevent the default action)
    e.preventDefault();

    //make events
    const cancelEvent = new CustomEvent("dragging-cancel", {bubbles: true, composed: true, triggerEvent: e});

    //record
    stopRecordingEvent();

    //dispatch event
    dispatchPriorEvent([newTarget, cancelEvent, e]);
  }

  window.addEventListener("mousedown", e => onMousedown(e));
})();