type ParsedData = {
	Year: number;
	Month: number;
	Day: number;
	SecondsPastDay: number;
	Latitude: number;
	Longitude: number;
	Submerged: boolean;
	GPSFlag: number;
	SST: number;
	BatteryVoltage: number;
};

export const parseBuffer = (buffer: Buffer): ParsedData => {
	let offset = 0;

	// Parse Time (32 bits)
	const timeBits = buffer.readUInt32BE(offset);
	const year = 2000 + ((timeBits >> 26) & 0x3f); // Year (6 bits)
	const month = (timeBits >> 22) & 0xf; // Month (4 bits)
	const day = (timeBits >> 17) & 0x1f; // Day (5 bits)
	const secondsPastDay = timeBits & 0x1ffff; // Seconds past day (17 bits)
	offset += 4;

	// Parse Latitude (30 bits)
	const latitudeRaw = buffer.readUInt32BE(offset);
	const latitudeBits = latitudeRaw >>> 2; // Extract 30 bits (shift out 2 extra bits)
	const latitude = latitudeBits / 3600000 - 90;
	offset += 4;

	// Parse Longitude (31 bits)
	const longitudeRaw = buffer.readUInt32BE(offset);
	const longitudeBits = (longitudeRaw >>> 1) & 0x7fffffff; // Extract 31 bits (shift out 1 extra bit)
	const longitude = longitudeBits / 3600000 - 180;
	offset += 4;

	// Parse Submerged (1 bit) and GPS Flag (2 bits)
	const flagsByte = buffer.readUInt8(offset);
	const submerged = !!(flagsByte & 0b10000000); // Extract the most significant bit (1 bit)
	const gpsFlag = (flagsByte >> 5) & 0b11; // Extract next 2 bits for GPS flag

	const remainingBits = flagsByte & 0x1f; // Keep the remaining 5 bits (5 bits left)
	offset += 1;

	// Parse SST (12 bits)
	const nextByte = buffer.readUInt8(offset);
	const sstBits = (remainingBits << 7) | (nextByte >> 1); // Combine 5 remaining bits with 7 bits from the next byte (total 12 bits)
	const sst = sstBits * 0.01 - 5.0;

	// Parse Battery Voltage (4 bits)
	const batteryVoltageBits = nextByte & 0x0f; // Extract the last 4 bits from the byte used for SST
	const batteryVoltage = batteryVoltageBits / 2 + 5;
	offset += 1;

	return {
		Year: year,
		Month: month,
		Day: day,
		SecondsPastDay: secondsPastDay,
		Latitude: latitude,
		Longitude: longitude,
		Submerged: submerged,
		GPSFlag: gpsFlag,
		SST: sst,
		BatteryVoltage: batteryVoltage,
	};
};

try {
	const hexStrings = process.argv.slice(2);

	if (hexStrings.length < 1) {
		console.log('No Valid Hex Strings');
	}

	console.log(
		'| Year | Month | Day | Seconds Past Day | Latitude    | Longitude    | Submerged | GPS Flags | SST   | Battery Voltage |'
	);
	console.log(
		'|------|-------|-----|-----------------|-------------|--------------|-----------|-----------|-------|-----------------|'
	);

	hexStrings.forEach((hexString) => {
		try {
			const buffer = Buffer.from(hexString, 'hex');
			const parsedData = parseBuffer(buffer);
			console.log(
				`| ${parsedData.Year}  | ${parsedData.Month}     | ${
					parsedData.Day
				}   | ${
					parsedData.SecondsPastDay
				}          | ${parsedData.Latitude.toFixed(
					7
				)} | ${parsedData.Longitude.toFixed(7)}  | ${
					parsedData.Submerged ? 1 : 0
				}         | ${parsedData.GPSFlag}         | ${parsedData.SST.toFixed(
					2
				)}  | ${parsedData.BatteryVoltage.toFixed(1)}          |`
			);
		} catch (error: any) {
			console.error(
				`Error parsing hex string "${hexString}": ${error.message}`
			);
		}
	});
} catch (error: any) {
	console.error('Error:', error.message);
}

export default parseBuffer;
