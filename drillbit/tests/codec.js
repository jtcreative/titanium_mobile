describe("Ti.Codec tests", {
	testAPI: function() {
		valueOf(Ti.Codec).shouldBeObject();

		var functions = ["encodeNumber", "decodeNumber", "encodeString", "decodeString", "getNativeByteOrder"];
		for (var i = 0; i < functions.length; i++) {
			valueOf(Ti.Codec[functions[i]]).shouldBeFunction();
		};

		valueOf(Ti.Codec.CHARSET_ASCII).shouldBe("ascii");
		valueOf(Ti.Codec.CHARSET_UTF8).shouldBe("utf8");
		valueOf(Ti.Codec.CHARSET_UTF16).shouldBe("utf16");
		valueOf(Ti.Codec.CHARSET_UTF16BE).shouldBe("utf16be");
		valueOf(Ti.Codec.CHARSET_UTF16LE).shouldBe("utf16le");

		valueOf(Ti.Codec.TYPE_BYTE).shouldBe("byte");
		valueOf(Ti.Codec.TYPE_SHORT).shouldBe("short");
		valueOf(Ti.Codec.TYPE_INT).shouldBe("int");
		valueOf(Ti.Codec.TYPE_LONG).shouldBe("long");
		valueOf(Ti.Codec.TYPE_FLOAT).shouldBe("float");
		valueOf(Ti.Codec.TYPE_DOUBLE).shouldBe("double");

		valueOf(Ti.Codec.BIG_ENDIAN).shouldBeNumber();
		valueOf(Ti.Codec.LITTLE_ENDIAN).shouldBeNumber();
		// TODO: Spec explicitly says this is getNativeByteOrder(), not a property
		// Decide on final value
		valueOf(Ti.Codec.nativeByteOrder).shouldBeOneOf([Ti.Codec.BIG_ENDIAN, Ti.Codec.LITTLE_ENDIAN]);
	},

	testEncodeIntegers: function() {
		var buffer = Ti.createBuffer({ length: 8 });

		Ti.Codec.encodeNumber({
			dest: buffer,
			data: 0x123456789a,
			type: Ti.Codec.TYPE_LONG
		});

		if (Ti.Codec.nativeByteOrder == Ti.Codec.BIG_ENDIAN) {
			for (var i = 0; i < 3; i++) {
				valueOf(buffer[i]).shouldBe(0);
			}
			valueOf(buffer[3]).shouldBe(0x12);
			valueOf(buffer[4]).shouldBe(0x34);
			valueOf(buffer[5]).shouldBe(0x56);
			valueOf(buffer[6]).shouldBe(0x78);
			valueOf(buffer[7]).shouldBe(0x9a);
		} else {
			valueOf(buffer[4]).shouldBe(0x12);
			valueOf(buffer[3]).shouldBe(0x34);
			valueOf(buffer[2]).shouldBe(0x56);
			valueOf(buffer[1]).shouldBe(0x78);
			valueOf(buffer[0]).shouldBe(0x9a);
			for (var i = 5; i < 8; i++) {
				valueOf(buffer[i]).shouldBe(0);
			}
		}

		buffer.length = 10;
		buffer.clear();

		Ti.Codec.encodeNumber({
			dest: buffer,
			data: 0x123456789a,
			type: Ti.Codec.TYPE_LONG,
			byteOrder: Ti.Codec.BIG_ENDIAN,
			position: 2
		});

		for (var i = 2; i < 5; i++) {
			valueOf(buffer[i]).shouldBe(0);
		}
		valueOf(buffer[5]).shouldBe(0x12);
		valueOf(buffer[6]).shouldBe(0x34);
		valueOf(buffer[7]).shouldBe(0x56);
		valueOf(buffer[8]).shouldBe(0x78);
		valueOf(buffer[9]).shouldBe(0x9a);

		buffer.length = 4;
		buffer.clear();

		// down casting discards the high bits (0x12)
		Ti.Codec.encodeNumber({
			dest: buffer,
			data: 0x123456789a,
			type: Ti.Codec.TYPE_INT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});

		valueOf(buffer[0]).shouldBe(0x34);
		valueOf(buffer[1]).shouldBe(0x56);
		valueOf(buffer[2]).shouldBe(0x78);
		valueOf(buffer[3]).shouldBe(0x9a);

		buffer.length = 2;
		buffer.clear();

		// down casting discards the high bits (0x3)
		Ti.Codec.encodeNumber({
			dest: buffer,
			data: 0x34567,
			type: Ti.Codec.TYPE_SHORT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		valueOf(buffer[0]).shouldBe(0x45);
		valueOf(buffer[1]).shouldBe(0x67);
	},

	testDecodeIntegers: function() {
		var buffer = Ti.createBuffer({ length: 8 });
		buffer[0] = 0x9a;
		buffer[1] = 0x78;
		buffer[2] = 0x56;
		buffer[3] = 0x34;
		buffer[4] = 0x12;
		var n = Ti.Codec.decodeNumber({
			src: buffer,
			type: Ti.Codec.TYPE_LONG,
			byteOrder: Ti.Codec.LITTLE_ENDIAN
		});
		valueOf(n).shouldBe(0x123456789a);
	},

	testDecodeFloatingPoint: function() {
		var buffer = Ti.createBuffer({ length: 8 });
		// Should be ~1/3
		buffer[0] = 0x3f;
		buffer[1] = 0xd5;
		for (var i = 2; i < 8; i++) {
			buffer[i] = 0x55;
		}

		var n = Ti.Codec.decodeNumber({
			src: buffer,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		valueOf(n).shouldBe(1/3);

		// 1.23456789 -> 0x3ff3c0ca4283de1b
		buffer = Ti.createBuffer({
			data: 1.23456789,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});

		valueOf(buffer[0]).shouldBe(0x3f);
		valueOf(buffer[1]).shouldBe(0xf3);
		valueOf(buffer[2]).shouldBe(0xc0);
		valueOf(buffer[3]).shouldBe(0xca);
		valueOf(buffer[4]).shouldBe(0x42);
		valueOf(buffer[5]).shouldBe(0x83);
		valueOf(buffer[6]).shouldBe(0xde);
		valueOf(buffer[7]).shouldBe(0x1b);

		// 0x3ff3c0ca4283de1b -> 1.23456789
		buffer.clear();
		buffer.length = 8;
		buffer[0] = 0x3f;
		buffer[1] = 0xf3;
		buffer[2] = 0xc0;
		buffer[3] = 0xca;
		buffer[4] = 0x42;
		buffer[5] = 0x83;
		buffer[6] = 0xde;
		buffer[7] = 0x1b;

		n = Ti.Codec.decodeNumber({
			src: buffer,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		valueOf(n).shouldBe(1.23456789);
	},
	
	options: {
		forceBuild: true
	}
});