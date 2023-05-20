import Jimp from 'jimp';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { createPresignedUrlForGetRequest, uploadPresignedObject } from 'src/helpers';
const s3 = new S3Client({ region: process.env.region });
const destinationFolder = process.env.THUMBNAILS_FOLDER;
const sizes = [
    { width: 400, height: 300, proportion: 'large' },
    { width: 160, height: 120, proportion: 'medium' },
    { width: 120, height: 120, proportion: 'small' },
];
const streamToBuffer = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.once('end', () => resolve(Buffer.concat(chunks)));
    stream.once('error', reject);
});
const resizer = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const { Body, ContentType } = await s3.send(command);
        const body = Body;
        const buffer = await streamToBuffer(body);
        try {
            const urlsForDownload = [];
            const jimpImage = await Jimp.read(buffer);
            await Promise.all(sizes.map(async ({ width, height, proportion }) => {
                const fileKey = `${proportion}-${uuid()}`;
                const resizedImage = jimpImage.clone();
                resizedImage.resize(width, height);
                const resizedBuffer = await resizedImage.getBufferAsync(ContentType);
                const resizedBucketParams = {
                    region: process.env.region,
                    bucket: bucket,
                    key: `${destinationFolder}/${fileKey}`
                };
                const presignedUrlForDownload = await createPresignedUrlForGetRequest(resizedBucketParams);
                urlsForDownload.push(presignedUrlForDownload);
                await uploadPresignedObject(resizedBucketParams, resizedBuffer);
            }));
        }
        catch (err) {
            const message = `Error when trying to resize original image`;
            throw new Error(message);
        }
        ;
    }
    catch {
        const message = `Error processing S3 Handler.`;
        throw new Error(message);
    }
};
export const main = resizer;
//# sourceMappingURL=handler.js.map