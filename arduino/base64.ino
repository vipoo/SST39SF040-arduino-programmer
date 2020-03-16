
typedef byte readAByte(unsigned long);
typedef void writeAChar(byte);
typedef byte readAChar();
typedef void writeAByte(byte, unsigned long);
void binaryEncode(readAByte, writeAByte);
void binaryDecode(readAChar, writeAByte);


#define BLOCK_LENGTH 1024L * 512 // (1024L * 512)

void binaryEncode(readAByte reader, writeAChar writer) {
	for (long i = 0; i < BLOCK_LENGTH; i++)
		writer(reader(i));
}

void binaryDecode(readAChar reader, writeAByte writer) {
	for (long i = 0; i < BLOCK_LENGTH; i++)
		writer(reader(), i);
}
