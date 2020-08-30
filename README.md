
# Arduino "shield" for SST39SF040

Project contains the Arduino sketch to flash onto a MEGA 2356 board and associated node script to upload and verify ROM images

## Installing

### Arduino Code:

Tooling has been developed on WSL 2.0 for windows - but should work ok for native linux

To build and upload the sketch - you can use the Arduino IDE or use the included make system

Within the arduino directory:

`cd arduino`

Run the following to download a specific version of Arduino binaries

`make config`

The to build a new image within linux:

`make build`

And then to upload to device -

`make upload` (assumes a COM port mapping of COM3)

### Node Code

`npm install`
