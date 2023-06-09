// 
// POINTS
// Alle variabler og funksjoner som har med å anker- og kontrollpunkter
// 
class Points {
  constructor() {

    this.anchors = this.populateAnchorPoints();
    this.controls = this.calculateControlPoints(this.anchors);
    // this.coordinates
  }

  setAnchorPoint(index, newValue) {
    this.anchors[index] = newValue;
  }

  setAnchors(newAnchors) {
    this.anchors = newAnchors;
  }

  // These are set points that can be changed to your liking
  populateAnchorPoints() {
    let anchorPoints = [];

    anchorPoints.push(createVector(140, 140));
    anchorPoints.push(createVector(80, 240));
    anchorPoints.push(createVector(90, 290));
    anchorPoints.push(createVector(390, 90));
    anchorPoints.push(createVector(480, 390));
    anchorPoints.push(createVector(90, 490));
    anchorPoints.push(createVector(290, 520));
    anchorPoints.push(createVector(340, 240));

    return anchorPoints;
  }

  // TODO:: Før du går videre - forklar hva alt gjør. Ta gjerne notater og tegne i boka. 

  calculateControlPoints(anchors) {
    let controlP = [];
    let radiusFactor = 0.4;
    for (let i = 0; i < anchors.length; i++) {
      let theta;

      // First node
      if (i === 0) {
        theta = {
          idx: i,
          prev: undefined,
          after: this.cartesianToPolarTheta(anchors[i], anchors[i + 1])
        };

        let dist = this.diffCurrentAndAfter(anchors, i);
        let r = this.cartesianToPolarRadius(dist.x, dist.y) * radiusFactor;

        let cp = this.polarToCartesian(theta.after, r);
        let cp1 = createVector(anchors[i].x + cp.x, anchors[i].y + cp.y);
        controlP.push([0, cp1]);

        // Last node
      } else if (i === anchors.length - 1) {
        theta = {
          idx: i,
          prev: this.cartesianToPolarTheta(controlP[i - 1][1], anchors[i]),
          after: undefined
        };

        let dist = this.diffCurrentAndAfter(anchors, i - 1);
        let r = this.cartesianToPolarRadius(dist.x, dist.y) * radiusFactor;

        let cp = this.polarToCartesian(theta.prev, r);
        let cp1 = createVector(anchors[i].x - cp.x, anchors[i].y - cp.y);

        controlP.push([cp1, 0]);

        // Middle anchors
      } else {
        // Theta: Finds the angle value to previous and the next node. 
        theta = {
          idx: i,
          prev: this.cartesianToPolarTheta(anchors[i - 1], anchors[i]),
          after: this.cartesianToPolarTheta(anchors[i], anchors[i + 1])
        };

        // Calculates the middle angle between last and previous nodes.
        let theta_avg = (theta.prev + theta.after) / 2;

        // Setter current som et midlertidig origo.
        // kartesisk vektor fra origo = n-1 -> n
        let dist1 = this.diffCurrentAndAfter(anchors, i - 1);
        //  Regner ut hypotenusen som er det samme som radius / (fly)avstand mellom nodene 
        // Avstand til forrige
        let r1 = this.cartesianToPolarRadius(dist1.x, dist1.y) * radiusFactor;

        // kartesisk vektor fra origo = n -> n + 1
        let dist2 = this.diffCurrentAndAfter(anchors, i);
        // Avstand til neste
        let r2 = this.cartesianToPolarRadius(dist2.x, dist2.y) * radiusFactor;

        // Skrur det tilbake til vanlig kartesisk koordinater. 
        // Avstand og vinkel til forrige
        // let cpp1 = polarToCartesian(theta.prev, r1);
        let cpp1 = this.polarToCartesian(theta_avg, r1);

        // Avstand og vinkel til neste
        // let cpp2 = polarToCartesian(theta.after, r2);
        let cpp2 = this.polarToCartesian(theta_avg, r2);

        // cp1 og cp2 - kontrollpunkter på hver side av noden. 
        let cp1 = createVector(anchors[i].x - cpp1.x, anchors[i].y - cpp1.y);
        let cp2 = createVector(anchors[i].x + cpp2.x, anchors[i].y + cpp2.y);

        // TODO:: What is diff between cpp and cp ? 
        // controlP.push([cp1, cp2]);
        controlP.push([cpp1, cpp2]);

      }
    }

    // if first control point - use only one 
    controlP[0] = this.getTangent(anchors, controlP, 0);

    return controlP;

  }

  getTangent(anchors, controlP, i) {

    if (!anchors.length) {
      return [0, 0];
    }


    let angle = this.cartesianToPolarTheta(anchors[i], controlP[i + 1][0]);

    let dist = this.diffCurrentAndAfter(anchors, i);
    let r = this.cartesianToPolarRadius(dist.x, dist.y) * 0.3;

    let cp = this.polarToCartesian(angle, r);
    let cp1 = createVector(anchors[i].x + cp.x, anchors[i].y + cp.y);

    return [0, cp1];
  }



  diffCurrentAndAfter(anchors, i) {
    let x = abs(anchors[i].x) - abs(anchors[i + 1].x);
    let y = abs(anchors[i].y) - abs(anchors[i + 1].y);
    return createVector(abs(x), abs(y));
  }

  polarToCartesian(theta, radius) {
    let x = round(radius * cos(theta));
    let y = round(radius * sin(theta));
    return (createVector(x, y));
  }

  cartesianToPolarRadius(x, y) {
    let r = sqrt(x * x + y * y);
    return r;
  }

  cartesianToPolarTheta(from, to) {
    let x = to.x - from.x;
    let y = to.y - from.y;
    let theta = atan2(y, x);
    return theta;
  }

}

