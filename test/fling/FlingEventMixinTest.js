import {FlingEventMixin, flingAngle} from "../../src/FlingEventMixin.js";

describe('FlingEventMixin', function () {

  it("flingAngle 0", function () {
    expect(flingAngle(0,1)).to.be.equal(0);
  });
  it("flingAngle 90", function () {
    expect(flingAngle(1,1)).to.be.equal(90);
  });
  it("flingAngle 180", function () {
    expect(flingAngle(0,-1)).to.be.equal(180);
  });
  it("flingAngle 270", function () {
    expect(flingAngle(-1,-1)).to.be.equal(270);
  });
});