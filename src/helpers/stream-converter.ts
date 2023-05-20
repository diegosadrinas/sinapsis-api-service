import { Readable } from "stream";


export const streamToBuffer = (stream: Readable) => new Promise<Buffer>((resolve, reject) => {
	const chunks: Buffer[] = []
	stream.on('data', chunk => chunks.push(chunk))
	stream.once('end', () => resolve(Buffer.concat(chunks)))
	stream.once('error', reject)
});

export const streamToString = (stream: Readable) => new Promise<string>((resolve, reject) => {
	const chunks: Buffer[] = []
	stream.on('data', chunk => chunks.push(chunk))
	stream.once('end', () => resolve(Buffer.concat(chunks).toString("utf8")))
	stream.once('error', reject)
});

