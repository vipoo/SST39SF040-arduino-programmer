

typedef byte readAByte(unsigned long);
typedef void writeAChar(char);
typedef char readAChar();
typedef void writeAByte(byte, unsigned long);

#define BLOCK_LENGTH 1024L * 512 // (1024L * 512)

const char PROGMEM _Base64AlphabetTable[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		"abcdefghijklmnopqrstuvwxyz"
		"0123456789+/";

void base64Encode(readAByte reader, writeAChar writer) {
	byte i = 0, j = 0;
	unsigned char A3[3];
	unsigned char A4[4];
  unsigned long inputLength = BLOCK_LENGTH;
  unsigned long address = 0;

	while(inputLength--) {
		A3[i++] = reader(address++);
		if(i == 3) {
			fromA3ToA4(A4, A3);

			for(i = 0; i < 4; i++)
				writer(pgm_read_byte(&_Base64AlphabetTable[A4[i]]));

			i = 0;
		}
	}

	if(i) {
		for(j = i; j < 3; j++)
			A3[j] = '\0';

		fromA3ToA4(A4, A3);

		for(j = 0; j < i + 1; j++)
			writer(pgm_read_byte(&_Base64AlphabetTable[A4[j]]));

		while((i++ < 3))
			writer('=');
	}
}

void base64Decode(readAChar reader, writeAByte writer) {
	byte i = 0, j = 0;
	unsigned char A3[3];
	unsigned char A4[4];
  unsigned long address = 0;

	while (true) {
    const char input = reader();
		if(input == '=')
			break;

		A4[i++] = input;
		if (i == 4) {
			for (i = 0; i <4; i++)
				A4[i] = lookupTable(A4[i]);

			fromA4ToA3(A3,A4);

			for (i = 0; i < 3; i++)
				writer(A3[i], address++);

			i = 0;
		}
	}

	if (i) {
		for (j = i; j < 4; j++)
			A4[j] = '\0';

		for (j = 0; j <4; j++)
			A4[j] = lookupTable(A4[j]);

		fromA4ToA3(A3,A4);

		for (j = 0; j < i - 1; j++)
			writer(A3[j], address++);
	}
}

//Private utility functions
inline void fromA3ToA4(unsigned char * A4, unsigned char * A3) {
	A4[0] = (A3[0] & 0xfc) >> 2;
	A4[1] = ((A3[0] & 0x03) << 4) + ((A3[1] & 0xf0) >> 4);
	A4[2] = ((A3[1] & 0x0f) << 2) + ((A3[2] & 0xc0) >> 6);
	A4[3] = (A3[2] & 0x3f);
}

inline void fromA4ToA3(unsigned char * A3, unsigned char * A4) {
	A3[0] = (A4[0] << 2) + ((A4[1] & 0x30) >> 4);
	A3[1] = ((A4[1] & 0xf) << 4) + ((A4[2] & 0x3c) >> 2);
	A3[2] = ((A4[2] & 0x3) << 6) + A4[3];
}

inline unsigned char lookupTable(char c) {
	if(c >='A' && c <='Z') return c - 'A';
	if(c >='a' && c <='z') return c - 71;
	if(c >='0' && c <='9') return c + 4;
	if(c == '+') return 62;
	if(c == '/') return 63;
	return -1;
}
