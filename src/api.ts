import { parseBuffer } from './parser';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.json());

app.post('/parse-hex', (req: any, res: any) => {
	const hexStrings: string[] = req.body.hex;

	if (!Array.isArray(hexStrings)) {
		return res
			.status(400)
			.json({ error: 'Request body must contain an array of hex strings' });
	}

	const results = hexStrings.map((hexString) => {
		try {
			const buffer = Buffer.from(hexString, 'hex');
			const parsedData = parseBuffer(buffer);
			return { hexString, parsedData };
		} catch (error: any) {
			return { hexString, error: error.message };
		}
	});

	res.json(results);
});

const PORT = 12345;

app.listen(PORT, () => {
	console.log(`API Running On Port ${PORT}`);
});
