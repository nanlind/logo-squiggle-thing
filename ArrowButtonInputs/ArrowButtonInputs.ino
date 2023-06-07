#include <ArduinoJson.hpp>
#include <ArduinoJson.h>
#include <CapacitiveSensor.h>

const int button_up = 10;  // the number of the pushbutton pin
const int button_right = 8;
const int button_down = 7;
const int button_left = 5;
const int button_start = 3;
const int button_end = 2;

CapacitiveSensor cs_4_2 = CapacitiveSensor(4, 2);    // 10M resistor between pins 4 & 2, pin 2 is sensor pin, add a wire and or foil if desired
CapacitiveSensor cs_4_6 = CapacitiveSensor(4, 6);    // 10M resistor between pins 4 & 6, pin 6 is sensor pin, add a wire and or foil
CapacitiveSensor cs_4_8 = CapacitiveSensor(4, 8);    // 10M resistor between pins 4 & 8, pin 8 is sensor pin, add a wire and or foil
CapacitiveSensor cs_4_12 = CapacitiveSensor(4, 11);  // 10M resistor between pins 4 & 8, pin 12 is sensor pin, add a wire and or foil

int id;
String val;

int draw_start = LOW;
int draw_end = LOW;
int buttonState[4] = { 0, 0, 0, 0};       // variable for reading the pushbutton status
String directions[] = { "UP", "RIGHT", "DOWN", "LEFT" };  // variable for reading the pushbutton status
// int a_sensor = 0;

String output; 

void setup() {
  Serial.begin(9600);

  id = 0;

  // initialize the pushbutton pin as an input:
  // pinMode(button_start, INPUT);
  // pinMode(button_end, INPUT);
}

void loop() {

 StaticJsonDocument<48> doc;

  long start = millis();

  long capValues[4];
  capValues[0] = cs_4_2.capacitiveSensor(30);
  capValues[1] = cs_4_6.capacitiveSensor(30);
  capValues[2] = cs_4_8.capacitiveSensor(30);
  capValues[3] = cs_4_12.capacitiveSensor(30);

  val = "";

  // read the state of the button value:
  for(byte i = 0; i < 4; i++){
    if(capValues[i] >= 12000){
      buttonState[i] = 1;
    } else {
      buttonState[i] = 0;
    }

  }

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

  delay(10);
}


String getDirection(int id) {

  switch (id) {
    case 2:
      return("u");

    case 6:
      return("u-r");

    case 4:
    return("r");

    case 12:
    return("d-r");

    case 8:
    return("d");


    case 24:
    return("d-l");

    case 16:
    return("l");

    case 18:
    return("u-l");

    default:
      break;
  }
}

