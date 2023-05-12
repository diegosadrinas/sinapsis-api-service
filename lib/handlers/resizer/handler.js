import { middyfy } from '@libs/lambda';
import { Buffer } from 'buffer';
import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from 'uuid';
import * as lambdaMultipartParser from 'aws-lambda-multipart-parser';
import Jimp from 'jimp';
import axios from 'axios';
import 'source-map-support/register';
const region = process.env.region;
const s3 = new S3({ region: region });
const bucket = process.env.BUCKET_NAME;
const originalFolder = 'original';
const resizedFolder = 'resized';
const sizes = [
    { width: 400, height: 300 },
    { width: 160, height: 120 },
    { width: 120, height: 120 },
];
const maxFileSize = process.env.MAX_FILE_SIZE;
const validFormats = ['jpg', 'jpeg', 'png'];
const resizer = async (event) => {
    try {
        const parsedData = lambdaMultipartParser.parse(event);
        const file = parsedData.image;
        const { type, filename, contentType, content } = file;
        const fileExt = filename.split('.').pop();
        const buffer = Buffer.from(content, 'binary');
        console.log(`Name: ${filename}, \nType: ${type}, \ncontent Type: ${file.contentType}, \n Extension: ${fileExt}`);
        if (!contentType.includes('image')) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid content type. Expected an image.'
                })
            };
        }
        if (!validFormats.includes(fileExt)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid image type. Only JPEG and PNG files are allowed' }),
            };
        }
        if (buffer.length > parseInt(maxFileSize)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'File size too large. Max file size allowed is 11mb.'
                })
            };
        }
        ;
        const createPresignedUrlWithClient = ({ region, bucket, contentType, key }) => {
            const command = new PutObjectCommand({ Bucket: bucket, Key: key });
            return getSignedUrl(s3, command, { expiresIn: 3600 });
        };
        const originalPresignedUrl = await createPresignedUrlWithClient({
            region: region,
            bucket: bucket,
            contentType: contentType,
            key: `${originalFolder}/${uuid()}.${fileExt}`,
        });
        await axios.put(originalPresignedUrl, buffer, {
            headers: {
                'Content-Type': contentType,
            },
        });
        const jimpImage = await Jimp.read(buffer);
        const resizeBuffer = await Promise.all(sizes.map(async (size) => {
            let resizedImage = jimpImage.clone();
            resizedImage.resize(size.width, size.height);
            let resizedBuffer = resizedImage.getBufferAsync(contentType);
            const resizedPresignedUrl = await createPresignedUrlWithClient({
                region: region,
                bucket: bucket,
                contentType: contentType,
                key: `${resizedFolder}/${uuid()}.${fileExt}`,
            });
            await axios.put(resizedPresignedUrl, resizedBuffer, {
                headers: {
                    'Content-Type': contentType,
                },
            });
        }));
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Image resized and uploaded successfully`,
            }),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `Image resizing and uploading failed`,
                error: error.message,
            }),
        };
    }
};
export const main = middyfy(resizer);
//# sourceMappingURL=handler.js.map