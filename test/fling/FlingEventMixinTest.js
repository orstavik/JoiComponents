import {FlingEventMixin} from "../../src/DragFlingGesture.js";

describe('DragFlingGesture', function () {

  const flingAngle = function flingAngle(x = 0, y = 0) {
    return ((Math.atan2(y, -x) * 180 / Math.PI)+270)%360;
  };

  it("flingAngle 0", function () {
    expect(flingAngle(0,1)).to.be.equal(0);
  });
  it("flingAngle 45", function () {
    expect(flingAngle(1,1)).to.be.equal(45);
  });
  it("flingAngle 90", function () {
    expect(flingAngle(1,0)).to.be.equal(90);
  });
  it("flingAngle 180", function () {
    expect(flingAngle(0,-1)).to.be.equal(180);
  });
  it("flingAngle 225", function () {
    expect(flingAngle(-1,-1)).to.be.equal(225);
  });
  it("flingAngle 270", function () {
    expect(flingAngle(-1,0)).to.be.equal(270);
  });
});