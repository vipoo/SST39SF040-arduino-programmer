
# Arduino "shield" for SST39SF040

Project contains the Arduino sketch to flash onto a MEGA 2356 board and associated node script to upload and verify ROM images.

Inspired by [mikemint64's blog](https://mint64.home.blog/2018/07/29/parallel-nor-flash-eeprom-programmer-using-an-arduino-part-1-the-sst39sf040-and-planning/)

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

### Programmer Application (nodejs app)

`npm install`

### Node programmer code

To upload a image to the Arduino, you need to use the sstprogram nodejs application.

First ensure you have the at least node version 14.3.0

then within the `programmer` directory.

`npm clean-install`

to verify its installed ok

`node index.js --help`


## Flashing a rom image

On windows

`sstprogram.cmd --port COM3 write -f image.rom --verify`

on WSL, via windows host

`winsstprogram.cmd --port COM3 write -f image.rom --verify`

> File path must be accessible from windows (eg: /mnt/c/Users/mary/Desktop/image.rom)



## Links

[Easy EDA project](https://easyeda.com/dean.netherton/experiment1)
