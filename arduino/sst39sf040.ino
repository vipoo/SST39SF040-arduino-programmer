#include "digitalWriteFast.h"

const int DataPins[] = {
  D0, D1, D2, D3, D4, D5, D6, D7
};

const int AddrPins[] = {
  A0, A1, A2, AB3, AB4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18
};

#define BUFFER_SIZE 128

void setCtrlPins();                                   //Setup control signals
void setAddrPinsOut();                                //Setup address signals
void setDigitalOut();                                 //Set D0-D7 as outputs
void setDigitalIn();                                  //Set D0-D7 as inputs
void setAddress(unsigned long addr);                  //Set Address across A0-A18
void setByte(byte out);                               //Set data across D0-D7
byte readByte();                                      //Read byte across D0-D7
void writeByte(byte data, unsigned long address);     //Write a byte of data at a specific address
void programData(byte data, unsigned long address);   //Executes the program command sequence
byte readData(unsigned long address);                 //Read data as specific address
void eraseChip();                                     //Executes the erase chip command sequece
void readSerialCommand(byte in);                      //Decodes incomming serial commands

void setup()
{
  setDigitalIn();
  setCtrlPins();
  setAddrPinsOut();

  Serial.begin(115200);
  delay(2);
  Serial.println("ACK-READY-ACK");
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  if (Serial.available())
    readSerialCommand(Serial.read());
}

void readSerialCommand(byte in) {
  switch (in)  {
    case 'A':
      setDigitalIn();

      readFirst10Bytes();
      return;

    case 'B':
      writeFirst10Bytes();
      Serial.println("10 bytes written");
      return;

    case 'E':
      eraseChip();
      Serial.println("Chip erased.");
      return;

    case 'R':
      setDigitalIn();

      base64Encode(readData, sendChar);
      return;

    case 'W': {
      eraseChip();
      Serial.write('A');
      base64Decode(readChar, programData);
      Serial.write('A');
      Serial.println("\nACK-DONE-ACK");
      return;
    }

    case '=':
      return;
  }

  Serial.print("Error ");
  Serial.print((char)in);
  Serial.println();
}

int wasBelow = false;

char readChar() {
  int count = Serial.available();

  if (count < 12 && !wasBelow) {
    Serial.write('X');
    digitalWrite(LED_BUILTIN, HIGH);
    wasBelow = true;
  } else if (count >= 12) {
    digitalWrite(LED_BUILTIN, LOW);
    wasBelow = false;
  }

  int waitSet = 0;
  while(Serial.available() == 0) {
    delay(3);
    if (waitSet == 0)
      Serial.write('Y');
    waitSet++;
    if(waitSet > 50)
      waitSet = 0;
  }

  return Serial.read();
}

void sendChar(char t) {
  Serial.write(t);
}

void eraseChip() {
  setDigitalOut();

  writeByte(0xAA, 0x5555);
  writeByte(0x55, 0x2AAA);
  writeByte(0x80, 0x5555);
  writeByte(0xAA, 0x5555);
  writeByte(0x55, 0x2AAA);
  writeByte(0x10, 0x5555);

  delay(100);
  setDigitalIn();
}

void readFirst10Bytes() {
  Serial.println("Reading first 10 bytes:");
  for(long i = 0; i < 10; i++) {
    const byte b = readData(i);
    String stringOne =  String(b, HEX);
    Serial.print(stringOne);
    Serial.print(" ");
  }

  Serial.println("\r\nDone.");
}

void writeFirst10Bytes() {
  programData('a', 0L);
  programData('b', 1L);
  programData('c', 2L);
  programData('d', 3L);
  programData('e', 4L);
  programData('f', 5L);
  programData('g', 6L);
  programData('h', 7L);
  programData('i', 8L);
  programData('j', 9L);
}

byte readData(unsigned long address) {
  byte temp_read;

  //digitalWrite(WE, HIGH);
  //digitalWrite(OE, HIGH);

  setAddressFast(address);

  digitalWriteFast(OE, LOW);
  delayMicroseconds(1);

  temp_read = readByteFast();

  digitalWriteFast(OE, HIGH);

  return temp_read;
}

void writeByte(byte data, unsigned long address) {
  digitalWrite(OE, HIGH);
  digitalWrite(WE, HIGH);

  setAddress(address);
  setByte(data);

  digitalWrite(WE, LOW);
  delayMicroseconds(1);
  digitalWrite(WE, HIGH);
}

int marker = 0;

void programData(byte data, unsigned long address) {
  setDigitalOut();

  writeByte(0xAA, 0x5555);
  writeByte(0x55, 0x2AAA);
  writeByte(0xA0, 0x5555);
  writeByte(data, address);

  delayMicroseconds(30);
}

byte readByte() {
  byte temp_in = 0;

  for (int i = 0; i < 8; i++)
    if (digitalRead(DataPins[i]))
      bitSet(temp_in, i);

  return temp_in;
}

byte readByteFast() {
  byte temp_in = 0;

  if(digitalReadFast(D0))
    bitSet(temp_in, 0);
  if(digitalReadFast(D1))
    bitSet(temp_in, 1);
  if(digitalReadFast(D2))
    bitSet(temp_in, 2);
  if(digitalReadFast(D3))
    bitSet(temp_in, 3);
  if(digitalReadFast(D4))
    bitSet(temp_in, 4);
  if(digitalReadFast(D5))
    bitSet(temp_in, 5);
  if(digitalReadFast(D6))
    bitSet(temp_in, 6);
  if(digitalReadFast(D7))
    bitSet(temp_in, 7);

  return temp_in;
}

void setByte(byte out) {
  for (int i = 0; i < 8; i++)
    digitalWrite( DataPins[i], bitRead(out, i) );
}

void setAddress(unsigned long addr) {
  for (int i = 0; i < 19; i++)
    digitalWrite( AddrPins[i], bitRead(addr, i) );
}

void setAddressFast(unsigned long addr) {
  if(bitRead(addr, 0))
    digitalWriteFast(A0, HIGH)
  else
    digitalWriteFast(A0, LOW);

  if(bitRead(addr, 1))
    digitalWriteFast(A1, HIGH)
  else
    digitalWriteFast(A1, LOW);

  if(bitRead(addr, 2))
    digitalWriteFast(A2, HIGH)
  else
    digitalWriteFast(A2, LOW);

  if(bitRead(addr, 3))
    digitalWriteFast(AB3, HIGH)
  else
    digitalWriteFast(AB3, LOW);

  if(bitRead(addr, 4))
    digitalWriteFast(AB4, HIGH)
  else
    digitalWriteFast(AB4, LOW);

  if(bitRead(addr, 5))
    digitalWriteFast(A5, HIGH)
  else
    digitalWriteFast(A5, LOW);

  if(bitRead(addr, 6))
    digitalWriteFast(A6, HIGH)
  else
    digitalWriteFast(A6, LOW);

  if(bitRead(addr, 7))
    digitalWriteFast(A7, HIGH)
  else
    digitalWriteFast(A7, LOW);

  if(bitRead(addr, 8))
    digitalWriteFast(A8, HIGH)
  else
    digitalWriteFast(A8, LOW);

  if(bitRead(addr, 9))
    digitalWriteFast(A9, HIGH)
  else
    digitalWriteFast(A9, LOW);

  if(bitRead(addr, 10))
    digitalWriteFast(A10, HIGH)
  else
    digitalWriteFast(A10, LOW);

  if(bitRead(addr, 11))
    digitalWriteFast(A11, HIGH)
  else
    digitalWriteFast(A11, LOW);

  if(bitRead(addr, 12))
    digitalWriteFast(A12, HIGH)
  else
    digitalWriteFast(A12, LOW);

  if(bitRead(addr, 13))
    digitalWriteFast(A13, HIGH)
  else
    digitalWriteFast(A13, LOW);

  if(bitRead(addr, 14))
    digitalWriteFast(A14, HIGH)
  else
    digitalWriteFast(A14, LOW);

  if(bitRead(addr, 15))
    digitalWriteFast(A15, HIGH)
  else
    digitalWriteFast(A15, LOW);

  if(bitRead(addr, 16))
    digitalWriteFast(A16, HIGH)
  else
    digitalWriteFast(A16, LOW);

  if(bitRead(addr, 17))
    digitalWriteFast(A17, HIGH)
  else
    digitalWriteFast(A17, LOW);

  if(bitRead(addr, 18))
    digitalWriteFast(A18, HIGH)
  else
    digitalWriteFast(A18, LOW);



}

void setAddrPinsOut() {
  for (int i = 0; i < 19; i++) {
    pinMode(AddrPins[i], OUTPUT);
    digitalWrite(AddrPins[i], LOW);
  }
}

void setDigitalOut() {
  for (int i = 0; i < 8; i++)
    pinMode(DataPins[i], OUTPUT);
}

void setDigitalIn() {
  for (int i = 0; i < 8; i++)
    pinMode(DataPins[i], INPUT);
}

void setCtrlPins() {
  pinMode(WE, OUTPUT);
  pinMode(OE, OUTPUT);
  pinMode(CE, OUTPUT);

  digitalWrite(WE, HIGH);
  digitalWrite(OE, HIGH);
  digitalWrite(CE, LOW);
}
