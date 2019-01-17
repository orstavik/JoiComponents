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
      if (!composedEvent || !target)
        return;
      composedEvent.preventDefault = function () {
        trigger.preventDefault();
        trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
      };
      composedEvent.trigger = trigger;
      return target.dispatchEvent(composedEvent);
    }

    //custom make events
    function makePinchEvent(name, trigger) {
      let detail;
      if (name === "stop"||name==="cancel") {
        detail = globalSequence.recorded[globalSequence.recorded.length - 1].detail;
      } else {
        detail = makeDetail(trigger);
      }
      return new CustomEvent("pinch-" + name, {bubbles: true, composed: true, detail});
    }

    function makeSpinEvent(trigger, sequence) {
      const spinTime = trigger.timeStamp - sequence.spinDuration;
      const spinStart = findLastEventOlderThan(sequence.recorded, spinTime);
      if (!spinStart)
        return null;
      const detail = globalSequence.recorded[globalSequence.recorded.length - 1].detail;
      detail.duration = sequence.spinDuration;
      detail.xFactor = Math.abs(spinStart.detail.width / detail.width);
      detail.yFactor = Math.abs(spinStart.detail.height / detail.height);
      detail.diagonalFactor = Math.abs(spinStart.detail.diagonal / detail.diagonal);
      detail.rotation = Math.abs(spinStart.detail.angle - detail.angle);
      let lastspinMotion = Math.abs(detail.x1 - spinStart.detail.x1) + (detail.y1 - spinStart.detail.y1); //the sum of the distance of the start and end positions of finger 1 and 2
      if (lastspinMotion < globalSequence.spinDistance)
        return;
      return new CustomEvent("spin", {bubbles: true, composed: true, detail});
    }

    function findLastEventOlderThan(events, timeTest) {
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].timeStamp < timeTest)
          return events[i];
      }
      return null;
    }

    function makeDetail(touchevent) {
      const f1 = touchevent.targetTouches[0];
      const f2 = touchevent.targetTouches[1];
      const x1 = f1.pageX;
      const y1 = f1.pageY;
      const x2 = f2.pageX;
      const y2 = f2.pageY;
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);
      const diagonal = Math.sqrt(width * width + height * height);
      const angle = calcAngle(x1 - x2, y1 - y2);
      return {touchevent, x1, y1, x2, y2, diagonal, width, height, angle};
    }

    function calcAngle(x = 0, y = 0) {
      return ((Math.atan2(y, -x) * 180 / Math.PI) + 270) % 360;
    }

    //custom sequence
    let globalSequence;
    let oneHit = false;
    const touchmoveListener = e => onTouchmove(e);
    const touchendListener = e => onTouchend(e);
    const touchcancelListener = e => onTouchcancel(e);

    function startSequence(target, e) {
      const body = document.querySelector("body");
      const sequence = {
        target,
        cancelMouseout: target.hasAttribute("pinch-cancel-mouseout"),
        spinDuration: parseInt(target.getAttribute("spin-duration")) || 100,
        spinDistance: parseInt(target.getAttribute("spin-distance")) || 100,
        recorded: [e],
        userSelectStart: body.style.userSelect,
        userTouchAction: body.style.touchAction
      };
      body.style.userSelect = "none";
      body.style.touchAction = "none";
      window.addEventListener("touchmove", touchmoveListener, {capture: true, passive: false});
      window.addEventListener("touchend", touchendListener, {capture: true, passive: false});
      !sequence.cancelMouseout && window.addEventListener("touchcancel", touchcancelListener, {
        capture: true,
        passive: false
      });
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
      window.removeEventListener("touchmove", touchmoveListener, {capture: true, passive: false});
      window.removeEventListener("touchend", touchendListener, {capture: true, passive: false});
      window.removeEventListener("touchcancel", touchcancelListener, {capture: true, passive: false});
      return undefined;
    }

    //custom listeners

    function onTouchStart(trigger) {
      //filter 1
      const touches = trigger.targetTouches.length;
      // should start from one finger
      if (touches === 1)
        oneHit = true;
      if (touches > 2)
        onTouchend(trigger);
      if (touches !== 2)
        return;
      if (!oneHit)    //first finger was not pressed on the element, so this second touch is part of something bigger.
        return;
      //filter 2
      if (globalSequence) {
        const cancelEvent = makePinchEvent("cancel", trigger);
        const target = globalSequence.target;
        globalSequence = stopSequence();
        dispatchPriorEvent(target, cancelEvent, trigger);
        return;
      }
      //filter 3
      const target = filterOnAttribute(trigger, "pinch");
      if (!target)
        return;
      const composedEvent = makePinchEvent("start", trigger);
      captureEvent(trigger, false);
      globalSequence = startSequence(target, composedEvent);
      dispatchPriorEvent(target, composedEvent, trigger);
    }

    function onTouchmove(trigger) {
      const composedEvent = makePinchEvent("move", trigger);
      captureEvent(trigger, false);
      globalSequence = updateSequence(globalSequence, composedEvent);
      dispatchPriorEvent(globalSequence.target, composedEvent, trigger);
    }

    function onTouchend(trigger) {
      oneHit = false;
      // debugger;
      const stopEvent = makePinchEvent("stop", trigger);
      const spinEvent = makeSpinEvent(trigger, globalSequence);
      captureEvent(trigger, false);
      const target = globalSequence.target;
      globalSequence = stopSequence();
      dispatchPriorEvent(target, stopEvent, trigger);
      dispatchPriorEvent(target, spinEvent, trigger);
    }

    function onTouchcancel(trigger) {
      //filter
      if (trigger.clientY > 0 && trigger.clientX > 0 && trigger.clientX < window.innerWidth && trigger.clientY < window.innerHeight)
        return;   //The mouse has not left the window
      //captureEvent(trigger, false);
      const cancelEvent = makePinchEvent("cancel", trigger);
      const target = globalSequence.target;
      globalSequence = stopSequence();
      dispatchPriorEvent(target, cancelEvent, trigger);
    }

    window.addEventListener("touchstart", e => onTouchStart(e), {capture: true, passive: false});
