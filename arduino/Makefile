
PORT=COM3

.ONESHELL:
SHELL:=/bin/bash

../tools/arduino-1.8.13-linux64.tar.xz:
	@mkdir -p ../tools
	@cd ../tools
	@wget https://downloads.arduino.cc/arduino-1.8.13-linux64.tar.xz


.PHONY: config
config: ../tools/arduino-1.8.13-linux64.tar.xz
	@cd ../tools
	@rm -rf arduino-1.8.13
	@echo "Extracting arduino binaries..."
	@tar xf arduino-1.8.13-linux64.tar.xz
	@./arduino-1.8.13/arduino --version

.PHONY: build
build:
	@mkdir -p ./bin
	@../tools/arduino-1.8.13/arduino  --verify arduino.ino --board arduino:avr:mega --pref build.path="$$(pwd)/bin" --pref sketchbook.path="$$(pwd)" --pref update.check=false --verbose

# Must be invoked on windows host
.PHONY: winupload
winupload:
	@/mnt/c/Windows/system32/cmd.exe /C "upload.cmd ${PORT}"
