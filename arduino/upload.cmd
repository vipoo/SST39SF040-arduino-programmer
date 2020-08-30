echo off
set port=%1
set speed=%2
IF %2.==. set speed=115200
IF %1.==. GOTO MissingPort

"C:\Program Files (x86)\Arduino\hardware\tools\avr/bin/avrdude" -C"C:\Program Files (x86)\Arduino\hardware\tools\avr/etc/avrdude.conf" -v -patmega2560 -cwiring -P%port% -b%speed% -D -Uflash:w:bin\arduino.ino.hex:i

GOTO end

:MissingPort
  ECHO "Port missing.  (upload.cmd PORT [BAUD])"

:end
