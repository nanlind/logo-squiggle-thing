class Canvas {
  constructor(x, y) {
    // Canvas size
    this.x = x;
    this.y = y;

    // Background image
    let imgPrefix = "bgImg/";
    this.backgroundImg = [
      `${imgPrefix}/tbaneliu.jpeg`,
      `${imgPrefix}/salathode.jpeg`
    ];

    // Background color
    this.bgColor = "#cfcfcf";
    this.bgColorSecondary = "#fcf";


    // rectMode = CENTER;
    // angleMode = DEGREES;



  }

}