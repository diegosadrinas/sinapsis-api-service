import Jimp from 'jimp';
import { middyfy } from '@libs/lambda';
import { Buffer } from 'buffer';
import { v4 as uuid } from 'uuid';
import { createPresignedUrlForGetRequest, uploadPresignedObject, responses } from '../../helpers';
const region = process.env.region;
const bucket = process.env.BUCKET_NAME;
const originalFolder = 'original';
const resizedFolder = 'resized';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE);
const validFormats = ['jpg', 'jpeg', 'png'];
const sizes = [
    { width: 400, height: 300 },
    { width: 160, height: 120 },
    { width: 120, height: 120 },
];
const resizer = async (event) => {
    try {
        console.log(`Entered in Resize Handler...`);
        if (!event.body) {
            return responses._400({ message: 'Incorrect body on request' });
        }
        const buffer = Buffer.from(event.body, 'base64');
        const contentType = event.headers['Content-Type'];
        const fileExt = contentType.split('/').pop();
        const bucketParams = {
            region: region,
            bucket: bucket,
            contentType: event.headers['Content-Type'],
            key: `${originalFolder}/${uuid()}`
        };
        if (!validFormats.includes(fileExt)) {
            return responses._400({ message: 'Invalid image type. Only JPEG and PNG files are allowed' });
        }
        if (buffer.length > maxFileSize) {
            return responses._400({ message: 'File size too large. Max file size allowed is 11mb.' });
        }
        ;
        await uploadPresignedObject(bucketParams, buffer);
        console.log("Image as binary uploaded");
        const mimeType = fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' : 'image/png';
        const urlsForDownload = [];
        const jimpImage = await Jimp.read(buffer);
        await Promise.all(sizes.map(async ({ width, height }) => {
            const fileKey = `${uuid()}.${fileExt}`;
            const resizedImage = jimpImage.clone();
            resizedImage.resize(width, height);
            const resizedBuffer = await resizedImage.getBufferAsync(mimeType);
            const resizedBucketParams = {
                ...bucketParams,
                key: `${resizedFolder}/${fileKey}`
            };
            const presignedUrlForDownload = await createPresignedUrlForGetRequest(resizedBucketParams);
            urlsForDownload.push(presignedUrlForDownload);
            await uploadPresignedObject(resizedBucketParams, resizedBuffer);
        }));
        return responses._200({ message: `Image resized and uploaded successfully`, data: urlsForDownload });
    }
    catch (error) {
        return responses._500({
            message: `Image resizing and uploading failed`,
            error: error.message,
        });
    }
    ;
};
export const main = middyfy(resizer);
//# sourceMappingURL=handler.js.map