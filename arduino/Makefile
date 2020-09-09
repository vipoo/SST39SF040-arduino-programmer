
PORT=COM3

ARDUINO_VERSION=1.8.13

.ONESHELL:
SHELL:=/bin/bash

../tools/arduino-${ARDUINO_VERSION}-linux64.tar.xz:
	@mkdir -p ../tools
	@cd ../tools
	@wget https://downloads.arduino.cc/arduino-${ARDUINO_VERSION}-linux64.tar.xz


.PHONY: config
config: ../tools/arduino-${ARDUINO_VERSION}-linux64.tar.xz
	@cd ../tools
	@rm -rf arduino-${ARDUINO_VERSION}
	@echo "Extracting arduino binaries..."
	@tar xf arduino-${ARDUINO_VERSION}-linux64.tar.xz
	@./arduino-${ARDUINO_VERSION}/arduino --version

.PHONY: build
build:
	function tearDown {
		patch --no-backup-if-mismatch -R ../tools/arduino-${ARDUINO_VERSION}/hardware/arduino/avr/cores/arduino/HardwareSerial.h HardwareSerial.h.patch
		rm ../tools/arduino-1.8.13/hardware/arduino/avr/platform.local.txt
	}
	trap tearDown EXIT
	patch --no-backup-if-mismatch ../tools/arduino-${ARDUINO_VERSION}/hardware/arduino/avr/cores/arduino/HardwareSerial.h HardwareSerial.h.patch
	cp ./platform.local.txt ../tools/arduino-1.8.13/hardware/arduino/avr
	mkdir -p ./bin
	../tools/arduino-${ARDUINO_VERSION}/arduino  --verify arduino.ino --board arduino:avr:mega --pref build.path="$$(pwd)/bin" --pref sketchbook.path="$$(pwd)" --pref update.check=false

# Create a patch file of the HardwareSerial.h file to increase RX buffer to 256 bytes
makediff:
	@diff ../tools/arduino-${ARDUINO_VERSION}/hardware/arduino/avr/cores/arduino/HardwareSerial.h ./hardware/HardwareSerial.h > HardwareSerial.h.patch

# Must be invoked on windows host
.PHONY: winupload
winupload:
	@/mnt/c/Windows/system32/cmd.exe /C "upload.cmd ${PORT}"
