const int DataPins[] = {
  D0, D1, D2, D3, D4, D5, D6, D7
};

const int AddrPins[] = {
  A0, A1, A2, AB3, AB4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18
};

byte data[2];
unsigned char base64[9];

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
}

void loop() {
  if (Serial.available())
    readSerialCommand(Serial.read());
}

void readSerialCommand(byte in) {
  switch (in)  {
    case 'R':
      base64Encode(readData, sendChar);
      return;

    case 'W': {
      eraseChip();
      Serial.println("Chip Erased.");
      base64Decode(readChar, programData);
      Serial.println("\nACK-DONE-ACK");
      return;
    }
  }

  Serial.print("Error");
}


char readChar() {
  char b = -1;

  while(Serial.available() == 0) {
    Serial.write('.');
    delay(300);
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

byte readData(unsigned long address) {
  byte temp_read;
  setDigitalIn();

  digitalWrite(WE, HIGH);
  digitalWrite(OE, HIGH);

  setAddress(address);

  digitalWrite(OE, LOW);
  delayMicroseconds(1);

  temp_read = readByte();

  digitalWrite(OE, HIGH);

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

void setByte(byte out) {
  for (int i = 0; i < 8; i++)
    digitalWrite( DataPins[i], bitRead(out, i) );
}

void setAddress(unsigned long addr) {
  for (int i = 0; i < 19; i++)
    digitalWrite( AddrPins[i], bitRead(addr, i) );
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

  digitalWrite(WE, HIGH);
  digitalWrite(OE, HIGH);
}
