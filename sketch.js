/*jshint esversion: 9 */


let canvas;
let stepSize = 30;

let roundNum = 0;
let numSteps = 2;

let anchorP = [];
let anchorP2 = [];
let controlP2 = [];
let controlP = [];
let selects = [2];
let selectInfo = [];
let newCoords = [];
let reflectNodes = {
  start: 1,
  num: 5,
  newCoords: []
};
let pointer;

// Serial I/O
let port;
let reader;
let inputDone;
let inputStream;

let textInput = "";
let textInputLen = 0;
let serialObjects = [];

let printAnchors = false;
let doLinearTranslate = false;
let doChainTranslate = false;
let doReflect = false;
let drawSquiggle = false;

let squares = [];
let squareSize = 60;

let stepz = 0;
let stepzCount = 0;



async function setup() {
  canvas = createVector(700, 700);
  createCanvas(canvas.x, canvas.y);

  useFixedAnchorPs();
  anchorP2 = [...anchorP];
  getTangents(anchorP);
  controlP2 = [...controlP];

  background("#cfc");

  // Init new coordination points
  selects.map(s => {
    newCoords.push(null);
  });
  pointer = createVector(140, 140);
}

function useFixedAnchorPs() {
  anchorP.push(createVector(140, 140));
  anchorP.push(createVector(80, 240));
  anchorP.push(createVector(90, 290));
  anchorP.push(createVector(390, 90));
  anchorP.push(createVector(480, 390));
  anchorP.push(createVector(90, 490));
  anchorP.push(createVector(290, 390));
  anchorP.push(createVector(340, 240));

}


// ------------------------------------------------
// ------------------ DRAW ------------------------
// ------------------------------------------------ 

function draw() {
  rectMode(CENTER);
  angleMode(DEGREES);

  let fps = round(random(6, 12));
  // frameRate(fps);
  frameRate(6);
  background("#fcf");

  arrowIsDown();
  drawWithSensors(textInput);

  if (!drawSquiggle) {
    chainTranslateNodes(anchorP, 3);
    chainTranslateNodes(anchorP, 2);
    chainTranslateNodes(anchorP, 1);
    chainTranslateNodes(anchorP, 0);
    translateNodes();
    moveReflectNodes();
  }
  if (drawSquiggle && !!anchorP.length) {
    if (anchorP[anchorP.length - 1].x !== pointer.x || anchorP[anchorP.length - 1].y !== pointer.y) {
      let anchors = [...anchorP, pointer];
      getTangents(anchors);
      drawInterpolations(anchors);
      drawOuterBorderRadius();
      drawControlPoints(anchors);
    } else if (anchorP.length > 1) {
      getTangents(anchorP);
      drawInterpolations(anchorP);
      drawOuterBorderRadius();
      drawControlPoints(anchorP);
    }
  } else if (!drawSquiggle) {
    getTangents(anchorP);
    drawInterpolations(anchorP);
    drawOuterBorderRadius();
    drawControlPoints(anchorP);
  }



  noFill();
  drawCurve();
  // if (!drawSquiggle) {
  //   drawControlPoints();
  // }
  drawAnchorPs();

  if (drawSquiggle) {
    showDrawingBrush();
  }


  if (!drawSquiggle) {
    fill(255);
    reflectNodes.newCoords.map(n => {

      circle(n.x, n.y, 7);
    });

    fill("green");
    circle(anchorP[reflectNodes.start].x, anchorP[reflectNodes.start].y, 7);
    circle(anchorP[reflectNodes.start + reflectNodes.num + 1].x, anchorP[reflectNodes.start + reflectNodes.num + 1].y, 7);
    fill("orange");
  }
}

function showDrawingBrush() {
  noStroke();
  fill(50);
  square(pointer.x, pointer.y, squareSize, 7);
  fill(230);
  circle(pointer.x, pointer.y, 6);
}

function moveReflectNodes() {
  if (!doReflect) {
    return;
  }
  // doLinearTranslate = false;
  doChainTranslate = false;

  let end = reflectNodes.start + reflectNodes.num + 1;
  selects = [];
  for (let i = reflectNodes.start + 1; i < end; i++) {
    selects.push(i);
  }

  newCoords = reflectNodes.newCoords;
  selectInfo = constructNodes(anchorP, selects, newCoords);

  // TODO:: Må gjøre doReflect til false et sted. 
  // For når du trykker på 'r' for andre gang mens 'p' er i gang så klikker hele greia


}

function getReflectCoords() {

  let end = reflectNodes.start + reflectNodes.num + 1;
  if (end > anchorP.length - 1) {
    end = anchorP.length - 1;
  }

  let angle = -cartesianToPolarTheta(anchorP[reflectNodes.start], anchorP[end]);
  let cos_a = cos(angle);
  let sin_a = sin(angle);

  let n_reflected = [];
  for (let i = reflectNodes.start + 1; i < end; i++) {

    let newPos = collapsedMatrix(cos_a, sin_a, anchorP[reflectNodes.start].x, anchorP[reflectNodes.start].y, anchorP[i]);
    n_reflected.push(newPos);
  }

  reflectNodes.newCoords = n_reflected;


}

function collapsedMatrix(c, s, x, y, p) {

  let r1 = createVector(c * c - s * s, -2 * c * s, x * (s * s - c * c) + x + 2 * c * s * y);
  let r2 = createVector(-2 * c * s, s * s - c * c, x * 2 * c * s + y * (c * c - s * s) + y);
  let r3 = createVector(0, 0, 1);

  let v2 = createVector(p.x, p.y, 1);

  let x_n = r1.dot(v2);
  let y_n = r2.dot(v2);
  let z_n = r3.dot(v2);

  return createVector(x_n, y_n);

}


function drawCurve() {
  beginShape();
  for (let i = 0; i < anchorP.length - 1; i++) {
    if (i === 0) {
      vertex(anchorP[i].x, anchorP[i].y);
    }
    bezierVertex(
      controlP[i][1].x, controlP[i][1].y,
      controlP[i + 1][0].x, controlP[i + 1][0].y,
      anchorP[i + 1].x, anchorP[i + 1].y
    );
  }
  endShape();
}

function drawControlPoints(anchors) {

  if (anchors.length < 2) {
    return;
  }
  stroke("grey");
  strokeWeight(1);
  for (let i = 0; i < controlP.length; i++) {
    if (i === 0) {
      line(anchors[i].x, anchors[i].y, controlP[i][1].x, controlP[i][1].y);
    } else if (i === controlP.length - 1) {
      line(anchors[i].x, anchors[i].y, controlP[i][0].x, controlP[i][0].y);
    } else {
      line(anchors[i].x, anchors[i].y, controlP[i][0].x, controlP[i][0].y);
      line(anchors[i].x, anchors[i].y, controlP[i][1].x, controlP[i][1].y);
    }

  }
  stroke("black");
}

function drawAnchorPs() {
  for (let i = 0; i < anchorP.length; i++) {
    let x = anchorP[i].x;
    let y = anchorP[i].y;

    if (selects.includes(i)) {
      fill("yellow");
    } else {
      fill("blue");
    }

    if (anchorP.length < 2) {
      fill(0);
      square(x, y, squareSize, 7);
    }


    dott(x, y);

    if (printAnchors) {
      console.log("( " + x + ", " + y + " )");
    }
  }
  if (printAnchors) {
    console.log(" ");
  }
}

function dott(x, y) {
  return circle(x, y, 7);
}


// ------------------------------------------------
// ---------------- CALCULATIONS ------------------
// ------------------------------------------------




function getTangents(anchors) {

  controlP = [];
  let radiusFactor = 0.4;
  for (let i = 0; i < anchors.length; i++) {
    let theta;

    // First node
    if (i === 0) {
      theta = {
        idx: i,
        prev: undefined,
        after: cartesianToPolarTheta(anchors[i], anchors[i + 1])
      };

      let dist = diffCurrentAndAfter(anchors, i);
      let r = cartesianToPolarRadius(dist.x, dist.y) * radiusFactor;

      let cp = polarToCartesian(theta.after, r);
      let cp1 = createVector(anchors[i].x + cp.x, anchors[i].y + cp.y);

      controlP.push([0, cp1]);

      // Last node
    } else if (i === anchors.length - 1) {
      theta = {
        idx: i,
        prev: cartesianToPolarTheta(controlP[i - 1][1], anchors[i]),
        after: undefined
      };

      let dist = diffCurrentAndAfter(anchors, i - 1);
      let r = cartesianToPolarRadius(dist.x, dist.y) * radiusFactor;

      let cp = polarToCartesian(theta.prev, r);
      let cp1 = createVector(anchors[i].x - cp.x, anchors[i].y - cp.y);

      controlP.push([cp1, 0]);

      // Middle anchors
    } else {
      theta = {
        idx: i,
        prev: cartesianToPolarTheta(anchors[i - 1], anchors[i]),
        after: cartesianToPolarTheta(anchors[i], anchors[i + 1])
      };

      let theta_avg = (theta.prev + theta.after) / 2;

      // let rFactor = 0.33;

      let dist1 = diffCurrentAndAfter(anchors, i - 1);
      let r1 = cartesianToPolarRadius(dist1.x, dist1.y) * radiusFactor;

      let dist2 = diffCurrentAndAfter(anchors, i);
      let r2 = cartesianToPolarRadius(dist2.x, dist2.y) * radiusFactor;

      let cpp1 = polarToCartesian(theta_avg, r1);
      let cpp2 = polarToCartesian(theta_avg, r2);

      let cp1 = createVector(anchors[i].x - cpp1.x, anchors[i].y - cpp1.y);
      let cp2 = createVector(anchors[i].x + cpp2.x, anchors[i].y + cpp2.y);

      controlP.push([cp1, cp2]);

    }
  }

  controlP[0] = getTangent(anchors, 0);
}

function getTangent(anchors, i) {

  if (!anchors.length) {
    return [0, 0];
  }

  let angle = cartesianToPolarTheta(anchors[i], controlP[i + 1][0]);

  let dist = diffCurrentAndAfter(anchors, i);
  let r = cartesianToPolarRadius(dist.x, dist.y) * 0.3;

  let cp = polarToCartesian(angle, r);
  let cp1 = createVector(anchors[i].x + cp.x, anchorP[i].y + cp.y);

  return [0, cp1];
}

function cartesianToPolarTheta(from, to) {
  let x = to.x - from.x;
  let y = to.y - from.y;
  let theta = atan2(y, x);
  return theta;
}

function cartesianDistance(from, to) {
  let x = to.x - from.x;
  let y = to.y - from.y;
  let r = sqrt(x * x + y * y);
  return r;
}

function cartesianToPolarRadius(x, y) {
  let r = sqrt(x * x + y * y);
  return r;
}

function polarToCartesian(theta, radius) {
  let x = round(radius * cos(theta));
  let y = round(radius * sin(theta));
  return (createVector(x, y));
}

function diffCurrentAndAfter(anchors, i) {
  let x = abs(anchors[i].x) - abs(anchors[i + 1].x);
  let y = abs(anchors[i].y) - abs(anchors[i + 1].y);
  return createVector(abs(x), abs(y));
}

function drawOuterBorderRadius() {

  let length = squareSize / 2;
  let size = round(squareSize / 10);

  for (let i = 0; i < squares.length - 1; i++) {

    let rootPos = getCurveRootPos(squares[i], squares[i + 1], length, 10);

    if (rootPos !== undefined) {

      let { upper, lower } = rootPos;

      borderRadius(upper.x, upper.y, size, upper.z);
      borderRadius(lower.x, lower.y, size, lower.z);
    }

  }
}

function getCurveRootPos(current, next, rad, offset) {
  let x1 = round(current.x);
  let x2 = round(next.x);
  let y1 = round(current.y);
  let y2 = round(next.y);

  if (x1 === x2 || y1 === y2) {
    return undefined;
  }


  if (x1 > x2) {
    if (y1 > y2) {
      // Next is top left 

      let rx = getR(x1, x2, rad, offset);
      let ry = getR(y1, y2, rad, offset);

      let upper = createVector(x2 + rx, y1 - ry, 3);
      let lower = createVector(x1 - rx, y2 + ry, 1);

      return {
        upper: upper,
        lower: lower,
      };
    } else {
      // Next is bottom left

      let rx = getR(x1, x2, rad, offset);
      let ry = getR(y1, y2, rad, offset);

      let upper = createVector(x1 - rx, y2 - ry, 2);
      let lower = createVector(x2 + rx, y1 + ry, 0);
      return {
        upper: upper,
        lower: lower,
      };
    }
  } else {
    if (y1 > y2) {
      // next is on top right
      let rx = getR(x1, x2, rad, offset);
      let ry = getR(y1, y2, rad, offset);

      let upper = createVector(x2 - rx, y1 - ry, 2);
      let lower = createVector(x1 + rx, y2 + ry, 0);
      return {
        upper: upper,
        lower: lower,
      };
    } else {
      // next is on bottom right

      let rx = getR(x1, x2, rad, offset);
      let ry = getR(y1, y2, rad, offset);

      let upper = createVector(x1 + rx, y2 - ry, 3);
      let lower = createVector(x2 - rx, y1 + ry, 1);
      return {
        upper: upper,
        lower: lower,

      };
    }
  }
}

function getR(n1, n2, rad, offset) {
  return abs(n1 - n2) < offset ? rad - offset : rad;
}


function borderRadius(x, y, size, orientation) {

  noStroke();
  // fill("red");

  let a1 = createVector(0, size);
  let a2 = createVector(size, 0);
  let cp1 = createVector(0, size * 0.5);
  let cp2 = createVector(size * 0.5, 0);

  push();
  translate(x, y);
  rotate(90 * orientation);
  beginShape();
  vertex(a1.x, a1.y);
  bezierVertex(cp1.x, cp1.y, cp2.x, cp2.y, a2.x, a2.y);
  vertex(a2.x, a2.y - 10);
  vertex(-10, a2.y - 10);
  vertex(-10, a1.y);
  vertex(a1.x, a1.y);
  endShape();
  pop();
}


// TODO:: If theta is 45 or 135 -> overlap should be smaller
function drawInterpolations(anchorPoints) {

  let overlap = squareSize;
  let maxIndex = anchorPoints.length - 1;

  squares = [];


  for (let i = 0; i < maxIndex; i++) {
    let estimatedDistance = dist(anchorPoints[i].x, anchorPoints[i].y, anchorPoints[i + 1].x, anchorPoints[i + 1].y);
    let t_length = estimatedDistance * 10.1;
    let steps = round(t_length / overlap);



    let prevPoint = anchorPoints[i];

    drawInterpolationPoint(anchorPoints[i].x, anchorPoints[i].y);
    squares.push(createVector(anchorPoints[i].x, anchorPoints[i].y));

    for (let stepCount = 0; stepCount <= steps; stepCount++) {
      let t = stepCount / steps;

      let a1_x = anchorPoints[i].x;
      let c1_x = controlP[i][1].x;
      let c2_x = controlP[i + 1][0].x;
      let a2_x = anchorPoints[i + 1].x;

      let a1_y = anchorPoints[i].y;
      let c1_y = controlP[i][1].y;
      let c2_y = controlP[i + 1][0].y;
      let a2_y = anchorPoints[i + 1].y;

      if (c2_x === undefined || c2_y === undefined) {
        break;
      }

      let x = bezierPoint(a1_x, c1_x, c2_x, a2_x, t);
      let y = bezierPoint(a1_y, c1_y, c2_y, a2_y, t);


      let distance = dist(x, y, prevPoint.x, prevPoint.y);

      if (distance > squareSize - squareSize * 0.1) {
        // if (distance > squareSize - 10 ) {

        drawInterpolationPoint(x, y);
        prevPoint = createVector(x, y);
        squares.push(createVector(x, y));
      }
    }


  }
}

function drawInterpolationPoint(x, y) {
  // strokeWeight(1);
  // noFill();

  strokeWeight(0);
  // let c = map(i, 0, anchorPoints.length - 1, 200, 0);
  // fill(c);
  // fill("yellow");
  // if (t < 0.2) {
  //   fill("#6B4B3E");
  // } else if (t > 0.8) {

  //   fill("#3F826D");
  // } else {

  //   fill("#D7B377");
  // }


  // fill(stepzCount * 10);
  fill(0);
  square(x, y, squareSize, 7);

}

function chainTranslateNodes(anchorPoints, i) {


  if (!doChainTranslate) {

    let len = dist(anchorPoints[i].x, anchorPoints[i].y, anchorPoints[i + 1].x, anchorPoints[i + 1].y);
    stepz = len / 1;

    return;
  }

  // stepz = len / stepSize;

  let t = stepzCount / stepz;

  // Rullere i positiv retning, ellers bytte + med - ? 
  let a1_x = anchorPoints[i].x;
  let c1_x = controlP[i][1].x;
  let c2_x = controlP2[i + 1][0].x;
  let a2_x = anchorP2[i + 1].x;

  let a1_y = anchorPoints[i].y;
  let c1_y = controlP[i][1].y;
  let c2_y = controlP2[i + 1][0].y;
  let a2_y = anchorP2[i + 1].y;

  let x = bezierPoint(a1_x, c1_x, c2_x, a2_x, t);
  let y = bezierPoint(a1_y, c1_y, c2_y, a2_y, t);

  anchorP[i] = createVector(x, y);


  if (stepzCount + 1 < stepz * 0.4) {
    stepzCount++;
  } else {
    doChainTranslate = false;
    return;
  }

}

function translateNodes() {

  if (!doLinearTranslate) {
    return;
  }

  selectInfo.map(selected => {
    selected.radius = doLinearTranslate ? polarTranslate(anchorP, selected.id, selected.theta, selected.radius, 1, selected.stepSize) : 0;

    selected.children = selected.children.map(child => {
      child.radius = doLinearTranslate ? polarTranslate(anchorP, child.id, child.theta, child.radius, child.weight, selected.stepSize * child.weight) : 0;
      return child;
    });

    return selected;
  });
  // selectInfo.map -> if r - stepsize = 0, i alt, doLinearTranslate = false (?)


  numSteps--;

  if (numSteps <= 0) {
    console.log(roundNum);
    roundNum++;

    // removeElements();
    doLinearTranslate = false;

    // Starts a new round with random values
    selects = getNewSelects();
    newCoords = getRandomCoords();

    sleep(100).then(startNewRound);

  }
}

function polarTranslate(anchorPoints, idx, theta, r, weight, stepSize) {

  anchorPoints[idx].x += cos(theta) * stepSize;
  anchorPoints[idx].y += sin(theta) * stepSize;

  return r -= (stepSize * weight);
}


function getNewSelects() {
  let maxNodes = anchorP.length;
  // let numSelected = random(1, 4);
  let numSelected = random(1, maxNodes / 2);
  let newSelected = [];

  for (let n = 0; n < numSelected; n++) {
    let randomIndex = floor(random(maxNodes));
    if (!arrIncludesElm(newSelected, randomIndex)) {
      newSelected.push(randomIndex);
    }
  }

  return newSelected;

}

function arrIncludesElm(arr, val) {
  return arr.some(a => a === val);
}

function getRandomCoords() {

  // let padding = 10;
  let padding = (squareSize / 2) + 10;

  let maxWidth = canvas.x - padding;
  let maxHeight = canvas.y - padding;

  let center = 100;
  let halfWidth = (canvas.x - center) / 2;
  let halfHeight = (canvas.y - center) / 2;
  // Choose random value and exclude center



  return selects.map(s => {
    let rWidth = [random(padding, halfWidth), random(maxWidth - halfWidth, maxWidth)];
    let rHeight = [random(padding, halfHeight), random(maxHeight - halfHeight, maxHeight)];
    // let r_width = round(random(padding, maxWidth));
    // let r_height = round(random(padding, maxHeight));

    let r_width = round(random(rWidth));
    let r_height = round(random(rHeight));
    return createVector(r_width, r_height);

  });
}


function constructNodes(anchorPoints, selects, newPos) {

  let longest_radius = 0;

  let selectInfo = selects.map((node_id, idx) => {

    let diff = getDiffCoord(anchorPoints[node_id], newPos[idx]);
    let radius = cartesianToPolarRadius(diff.x, diff.y);
    if (radius > longest_radius) {
      longest_radius = radius;
    }
    let theta = cartesianToPolarTheta(anchorPoints[node_id], newPos[idx]);

    let children = [];

    let generations = 2;
    for (let i = 1; i <= generations; i++) {
      let preChild = constructChild(anchorPoints, node_id, -i, newPos[idx]);
      let postChild = constructChild(anchorPoints, node_id, i, newPos[idx]);

      if (preChild) {
        children.push(preChild);
      }
      if (postChild) {
        children.push(postChild);
      }
    }


    let info = {
      id: node_id,
      radius: radius,
      theta: theta,
      children: children
    };

    return info;
  });

  // Relative stepSize 
  let sInfoWStepSize = selectInfo.map(selected => {
    numSteps = floor(longest_radius / stepSize);
    let relativeStepSize = selected.radius / numSteps;
    selected.stepSize = relativeStepSize;

    return selected;
  });

  return sInfoWStepSize;
}

function getDiffCoord(current, next) {
  // If selected === 0, then anchorPoints[-1] -> undefined 
  if (isFalsy(next)) {
    // TODO:: If difficult with undefined later, consider returning vec2(0, 0)
    return;
  }

  let x = abs(abs(next.x) - abs(current.x));
  let y = abs(abs(next.y) - abs(current.y));

  return createVector(x, y);
}

function constructChild(anchorPoints, p_idx, idxDiff, p_newCoord) {
  let childIdx = p_idx + idxDiff;

  if (selects.some(s_idx => s_idx === childIdx)) {
    return;
  }

  let child = anchorPoints[childIdx];

  if (child === undefined) {
    return;
  }

  // TODO:: Child 1 can go to a place between parents old pos and parents new pos
  // or left does that while right does something else


  // Destination = old position of parent or first child
  let destinationIdx = idxDiff > 0 ? p_idx + idxDiff - 1 : p_idx + idxDiff + 1; // The destination goal is one node closer to selected / selected itself

  // Destination same as parent´s destination - Replace with looking for if its 1 or 2. then go in same direction as selected if 1
  // let diffCoord = abs(idxDiff) === 1 ? getDiffCoord(child, p_newCoord) : getDiffCoord(child, anchorPoints[destinationIdx]); // get (x, y) diff between child and adjacent node
  let diffCoord = getDiffCoord(child, anchorPoints[destinationIdx]); // get (x, y) diff between child and adjacent node

  let theta = diffCoord ? cartesianToPolarTheta(child, p_newCoord) : undefined;
  // let theta = diffCoord ? cartesianToPolarTheta(child, anchorPoints[destinationIdx]) : undefined;

  let radius = diffCoord ? cartesianToPolarRadius(diffCoord.x, diffCoord.y) : undefined;
  let weight = doReflect ? 0 : calculateWeight(idxDiff, radius * 0.5);

  return ({
    id: p_idx + idxDiff,
    radius: radius,
    theta: theta,
    weight: weight
  });
}

function calculateWeight(idxDiff, radius) {
  if (abs(idxDiff) === 1) {
    return map(radius, 0, max(canvas.x, canvas.y), 0, 1);

  } else if (abs(idxDiff) === 2) {
    let maxDistance = sqrt(canvas.x * canvas.x + canvas.y * canvas.y);
    return map(radius, 0, maxDistance, 0, 1);

  }
  return 0;
}

function sleep(millisecondsDuration) {
  return new Promise((resolve) => {
    setTimeout(resolve, millisecondsDuration);
  });
}

function startNewRound() {

  doLinearTranslate = true;

  // Run code below each time newCoord or selects change
  if (newCoords.every(c => c !== undefined && c !== null)) {
    selectInfo = constructNodes(anchorP, selects, newCoords);
  } else {
    console.log("Not all new coords are defined");
  }
}

// ------------------------------------------------
// ----------------- SERIAL I/O -------------------
// ------------------------------------------------

async function readLoop() {
  try {
    // Listen to data coming from the serial device.
    while (true) {
      // // Done = true if serial port has been closed or no more data coming in. 

      const { value: chunk, done } = await reader.read();

      if (chunk) {
        textInput += chunk;
      }

      // Allow the serial port to be closed later.
      if (done) {
        console.log("[readLoop] DONE: " + done);
        reader.releaseLock();
        break;
      }
    }

  } catch (e) {
    console.error(e);
  }
  finally {
    reader.releaseLock();
  }
}


// ------------------------------------------------
// ----------------- INTERACTIVE ------------------
// ------------------------------------------------

function serialToJSON(inputString) {

  // Make string to array by splitting at this char: '{'
  let sensor_objs = inputString.split(/(?={)/g);

  // Is last char in inputString a '}' ? If yes, obj is complete, else remove last elm from array. 
  if (inputString[inputString.length - 1] !== "}") {
    textInput = sensor_objs.pop();
  } else {
    textInput = "";
  }

  let sensor_objs_json = sensor_objs.map(obj => {
    try {
      return JSON.parse(obj);
    } catch (e) {
      console.error("Could not parse string to JSON");
      console.error(e);
    }
  });

  return sensor_objs_json;
}


function drawWithSensors() {
  if (textInput.length !== textInputLen) {

    let input_json = serialToJSON(textInput);
    serialObjects.push(...input_json)
    textInputLen = textInput.length;
  }

  while (serialObjects.length > 0) {
    let first_in_queue = serialObjects.shift();

    let direction = first_in_queue.direction;
    moveDrawPointer(direction);

  }
}


// Replace with serial input
function moveDrawPointer(direction) {
  let stepSize = 20;

  switch (direction) {
    case 'u':
      pointer = createVector(pointer.x, pointer.y - stepSize);
      break;
    case 'u-r':
      pointer = createVector(pointer.x + stepSize, pointer.y - stepSize);
      break;

    case 'r':
      pointer = createVector(pointer.x + stepSize, pointer.y);
      break;

    case 'd-r':
      pointer = createVector(pointer.x + stepSize, pointer.y + stepSize);
      break;

    case 'd':
      pointer = createVector(pointer.x, pointer.y + stepSize);
      break;

    case 'd-l':
      pointer = createVector(pointer.x - stepSize, pointer.y + stepSize);
      break;

    case 'l':
      pointer = createVector(pointer.x - stepSize, pointer.y);
      break;

    case 'u-l':
      pointer = createVector(pointer.x - stepSize, pointer.y - stepSize);
      break;

    default:
      break;
  }
}


// Replace with serial input
function arrowIsDown() {
  let stepSize = 20;

  if (keyIsDown(UP_ARROW)) {
    pointer = createVector(pointer.x, pointer.y - stepSize);
  }
  if (keyIsDown(RIGHT_ARROW)) {
    pointer = createVector(pointer.x + stepSize, pointer.y);

  }
  if (keyIsDown(DOWN_ARROW)) {
    pointer = createVector(pointer.x, pointer.y + stepSize);

  }
  if (keyIsDown(LEFT_ARROW)) {
    pointer = createVector(pointer.x - stepSize, pointer.y);
  }
}

async function keyPressed() {
  if (key == 'p') {
    doLinearTranslate = true;
    // run this each time newCoord or selects change
    if (newCoords.every(c => c !== undefined && c !== null)) {
      selectInfo = constructNodes(anchorP, selects, newCoords);
      doReflect = false;

    } else {
      console.log("Not all new coords are defined");
    }

  }

  if (key == 'o') {
    doLinearTranslate = false;
  }
  if (key == 'r') {
    doLinearTranslate = false;


    doReflect = true;
    getReflectCoords();


    doLinearTranslate = true;
    if (newCoords.every(c => c !== undefined && c !== null)) {
      selectInfo = constructNodes(anchorP, selects, newCoords);
      doReflect = false;

    } else {
      console.log("Not all new coords are defined");
    }
  }

  if (key == 'c') {
    doChainTranslate = true;
  }

  if (key == 'v') {
    doChainTranslate = false;
  }

  if (key == 'a') {
    // draw / clear canvas & show pointer
    drawSquiggle = true;
    anchorP = [];
    console.log("drawSquiggle = true...");


    console.log("opening port...");
    port = await navigator.serial.getPorts();

    if (port && port.length > 0 && Array.isArray(port)) {
      port = port[0];
    } else {
      // Filter on devices with the Arduino Uno USB Vendor/Product IDs.
      const filters = [
        { usbVendorId: 0x2341, usbProductId: 0x0043 },
      ];
      port = await navigator.serial.requestPort({ filters });
    }

    console.log(port);

    // // Wait for the serial port to open.
    try {
      await port.open({ baudRate: 9600 });
    } catch (e) {
      console.error("Could not open port");
      console.error(e);
      return;
    }

    // // // // // // // // // // // 

    let decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;

    reader = inputStream.getReader();
    readLoop();

    // // // // // // // // // // // 


    /*
    Ide til senere:
    når a trykkes, så samles alle nodene til samme punkt 
    også beveger seg til startposisjon for tegningen */
  }

  if (key == 'd') {
    // draw done & jiggle / capture img
    drawSquiggle = false;
    keepReading = false;
    if (port) {
      await port.close();
    }

    console.log("drawSquiggle = false...");
  }

  if (key == 's') {
    // draw done & jiggle / capture img
    anchorP.push(createVector(pointer.x, pointer.y));
    console.log("Pushed pointer to anchorP...");
  }
  if (key == '1') {
    let mouse = createVector(mouseX, mouseY);
    newCoords[0] = isFalsy(newCoords[0]) ? mouse : null;
  }
  if (key == '2') {
    let mouse = createVector(mouseX, mouseY);
    newCoords[1] = isFalsy(newCoords[1]) ? mouse : null;
  }
  if (key == '3') {
    let mouse = createVector(mouseX, mouseY);
    newCoords[2] = isFalsy(newCoords[2]) ? mouse : null;
  }
}

function isFalsy(isTrue) {
  return isTrue === undefined || isTrue === null;
}

//  Hvis problemer med distribusjon av firkantentene. 
//  Så er mulig løsning her: 
//  https://gamedev.stackexchange.com/questions/5373/moving-ships-between-two-planets-along-a-bezier-missing-some-equations-for-acce