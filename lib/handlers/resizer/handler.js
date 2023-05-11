import { middyfy } from '@libs/lambda';
import 'source-map-support/register';
import { Buffer } from 'buffer';
import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl, } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from 'uuid';
const multipart = require('parse-multipart-data');
import * as lambdaMultipartParser from 'aws-lambda-multipart-parser';
import Jimp from 'jimp';
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
        const createPresignedUrlWithClient = ({ region, bucket, key }) => {
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            return getSignedUrl(s3, command, { expiresIn: 3600 });
        };
        const clientUrl = await createPresignedUrlWithClient({
            region: region,
            bucket: bucket,
            key: `${originalFolder}/${uuid()}`,
        });
        console.log(`Presigned URL with client: ${clientUrl}`);
        const parsedData = lambdaMultipartParser.parse(event);
        const file = parsedData.image;
        const fileName = file.filename;
        const fileExt = fileName.split('.').pop();
        console.log(`Headers: ${Object.keys(event.headers)} \n File Values: Type: ${file.type}, content Type: ${file.contentType} , \n Extension: ${fileExt}`);
        const decodedContent = file.content.toString('base64');
        const buffer = Buffer.from(file.content);
        console.log(buffer, buffer.length);
        const image = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
        const base64File = Buffer.from(event.body, 'base64');
        const payload = Buffer.from(event.body, 'base64');
        const boundary = event.headers['Content-Type'].split('=')[1];
        const parts = multipart.parse(base64File, boundary);
        console.log(`Payload: ${Object.keys(event.headers)}, Parts: ${parts}, Decoded File: ${parts}`);
        for (const part of parts) {
            const contentType = part.type;
            console.log(`Part Keys: ${Object.keys(part)}`);
            console.log(`Content-Type: ${contentType}`);
            if (!contentType.includes('image')) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Invalid content type. Expected an image.'
                    })
                };
            }
            const format = contentType.replace('image/', '');
            console.log(`Format: ${format}`);
            if (!validFormats.includes(format)) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Invalid image type. Only JPEG and PNG files are allowed' }),
                };
            }
            console.log(`Length: ${image.length}`);
            if (image.length > parseInt(maxFileSize)) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'File size too large. Max file size allowed is 11mb.'
                    })
                };
            }
            ;
            const partFileName = `${uuid()}.${format}`;
            ;
            const jimpImage = await Jimp.read(part.data);
            const convertedImageBuffer = await jimpImage.getBufferAsync(Jimp.MIME_JPEG);
            await s3
                .putObject({
                Bucket: bucket,
                Key: `${originalFolder}/${partFileName}`,
                Body: convertedImageBuffer,
                ContentType: contentType,
            });
        }
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