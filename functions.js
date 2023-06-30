class Functions {
  constructor() { }

  func1() {
    console.log("Hello!");
  }


  sleep(millisecondsDuration) {
    return new Promise((resolve) => {
      setTimeout(resolve, millisecondsDuration);
    });
  }

}