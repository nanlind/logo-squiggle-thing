#include <ArduinoJson.hpp>
#include <ArduinoJson.h>


// constants won't change. They're used here to set pin numbers:
const int button_up = 10;  // the number of the pushbutton pin
const int button_right = 8;
const int button_down = 7;
const int button_left = 5;
const int button_start = 3;
const int button_end = 2;
// const int analog_0 = A0;

int id;

String val;

int draw_start = LOW;
int draw_end = LOW;
int buttonState[4] = { LOW, LOW, LOW, LOW};       // variable for reading the pushbutton status
String directions[] = { "UP", "RIGHT", "DOWN", "LEFT" };  // variable for reading the pushbutton status
// int a_sensor = 0;

String output; 

void setup() {
  Serial.begin(9600);
  // initialize the pushbutton pin as an input:
  pinMode(button_up, INPUT);
  pinMode(button_right, INPUT);
  pinMode(button_down, INPUT);
  pinMode(button_left, INPUT);
  // pinMode(button_start, INPUT);
  // pinMode(button_end, INPUT);

  pinMode(13, OUTPUT);

  id = 0;

}

void loop() {

 StaticJsonDocument<48> doc;


  val = "";

  // read the state of the pushbutton value:
  buttonState[0] = digitalRead(button_up);
  buttonState[1] = digitalRead(button_right);
  buttonState[2] = digitalRead(button_down);
  buttonState[3] = digitalRead(button_left);
  draw_start = digitalRead(button_start);
  draw_end = digitalRead(button_end);

  // a_sensor = analogRead(analog_0);
  // Serial.println(a_sensor);


  int length = sizeof(buttonState) / sizeof(buttonState[0]);

  uint8_t numPressed = 0;
  uint16_t sum = 0;
  for (byte i = 0; i < length; i++) {
    if (buttonState[i] == HIGH && numPressed < 2) {
      numPressed++;

      int id = pow(2, i+1) + 0.5;
      sum += id;

    } 
  }


// TODO:: get variables for the two last buttons

  if(sum != 0){
    String dir = getDirection(sum);

    doc["id"] = id;
    doc["direction"] = dir;
    doc["toggle_draw"] = false;
    doc["set_anchor"] = false;
    doc["animate"] = false;

    // serializeJson(doc, Serial);
    // Serial.print("---");

    // // Produce a prettified JSON document
    serializeJsonPretty(doc, Serial);

    id+=1;
  }

  delay(100);
}


String getDirection(int id) {
  // Serial.print("Direction:     ");
  // Serial.println(id);

  switch (id) {
    case 2:
      return("up");

    case 6:
      return("up right");

    case 4:
    return("right");

    case 12:
    return("down right");

    case 8:
    return("down");


    case 24:
    return("down left");

    case 16:
    return("left");

    case 18:
    return("up left");

    default:
      break;
  }
}
void printDirection(int id) {
  // Serial.print("Direction:     ");
  // Serial.println(id);

  switch (id) {
    case 2:
      Serial.println("UP");
      break;

    case 6:
      Serial.println("UP RIGHT");
      break;

    case 4:
      Serial.println("RIGHT");
      break;

    case 12:
      Serial.println("DOWN RIGHT");
      break;

    case 8:
      Serial.println("DOWN");
      break;

    case 24:
      Serial.println("DOWN LEFT");
      break;

    case 16:
      Serial.println("LEFT");
      break;

    case 18:
      Serial.println("UP LEFT");
      break;

    default:
      break;
  }
}
void getDiagonal(int idx) {
  switch (idx) {
    case 0:
      Serial.println("UP LEFT");
      break;

    case 1:
      Serial.println("UP RIGHT");
      break;

    case 2:
      Serial.println("DOWN RIGHT");
      break;

    case 3:
      Serial.println("DOWN LEFT");
      break;

    default:
      Serial.println("default");
      break;
  }
}


void lightUp(){

  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13,LOW);
  delay(100);
  digitalWrite(13, HIGH);
  delay(100);
  digitalWrite(13,LOW);
  delay(100);
}
