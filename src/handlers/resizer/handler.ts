import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import { Buffer } from 'buffer';
import { GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from 'uuid';
import * as lambdaMultipartParser from 'aws-lambda-multipart-parser';
import Jimp from 'jimp'
import axios from 'axios'
import 'source-map-support/register'; //chequear esto


// Create S3 client
const region = process.env.region
const s3 = new S3({region: region});

// Define the S3 bucket and folder names
const bucket = process.env.BUCKET_NAME;
const originalFolder = 'original';
const resizedFolder = 'resized';

// Define the image variables
const sizes = [
  { width: 400, height: 300 },
  { width: 160, height: 120 },
  { width: 120, height: 120 },
];
const maxFileSize = process.env.MAX_FILE_SIZE
const validFormats = ['jpg', 'jpeg', 'png'];

// Resizer main logic:
const resizer: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    try {
    // Get the image file from the parsed data
        const parsedData = lambdaMultipartParser.parse(event);
        const file = parsedData.image;

    // Get the file properties and buffer
        const { type, filename, contentType, content } = file;
        const fileExt = filename.split('.').pop();
        const buffer = Buffer.from(content, 'binary')

        console.log(`Name: ${filename}, \nType: ${type}, \ncontent Type: ${file.contentType}, \nExtension: ${fileExt}`);

    // Check if file is of type image
        if (!contentType.includes('image')) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid content type. Expected an image.'
                })
            };
        } 
    // Check if the image is in a valid format
        if (!validFormats.includes(fileExt)) {
            return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid image type. Only JPEG and PNG files are allowed' }),
            };
        }
    // Check if the image file size is valid
        if (buffer.length > parseInt(maxFileSize)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'File size too large. Max file size allowed is 11mb.'
                })
            };
        };

    // -------------------------------------------------------------------------------------------------------------
    // TODO: Refactor this into one single function imported from Utils:
        const createPresignedUrlForPutRequest = ({ region, bucket, contentType, key }) => {
            const command = new PutObjectCommand({ Bucket: bucket, Key: key });
            return getSignedUrl(s3, command, { expiresIn: 3600 });
        };

        const createPresignedUrlForGetRequest = ({ region, bucket, contentType, key }) => {
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            return getSignedUrl(s3, command, { expiresIn: 3600 });
          };
        
        const originalPresignedUrl = await createPresignedUrlForPutRequest({
            region: region,
            bucket: bucket,
            contentType: contentType,
            key: `${originalFolder}/${uuid()}.${fileExt}`,
        });


    // Upload the file to S3 using the presigned URL
        await axios.put(originalPresignedUrl, buffer, {
            headers: {
                'Content-Type': contentType,
            },
            });

    // -------------------------------------------------------------------------------------------------------------

        const jimpImage = await Jimp.read(buffer)

        // Use the map method to create an array of buffers for each size
        const urlsForDownload: string[] = []
        const resizeImages = await Promise.all(sizes.map(async size => {
        // Create a clone of the original image
            let resizedImage = jimpImage.clone();
            // Resize the image using the width and height from the size object
            resizedImage.resize(size.width, size.height);
            // Write the resized image to a buffer and return it
            let resizedBuffer = await resizedImage.getBufferAsync(contentType);

            const resizedPresignedUrl = await createPresignedUrlForPutRequest({
                region: region,
                bucket: bucket,
                contentType: contentType,
                key: `${resizedFolder}/${uuid()}.${fileExt}`,
            });

            const presignedUrlForDownload = await createPresignedUrlForGetRequest({
                region: region,
                bucket: bucket,
                contentType: contentType,
                key: `${resizedFolder}/${uuid()}.${fileExt}`,
            });

            // Append presigned urls for final response
            urlsForDownload.push(presignedUrlForDownload)


            return axios.put(resizedPresignedUrl, resizedBuffer, {
                headers: {
                    'Content-Type': contentType,
                },
                });    
        }));

        await Promise.all(resizeImages);

        return {
            statusCode: 200,
            body: JSON.stringify({
            message: `Image resized and uploaded successfully`,
            data: urlsForDownload
            }),
        };
    
    //--------------------------------------------------------------------------------------------------------------

    // // Loop through the sizes and resize the image
    // for (const size of sizes) {
    //   // Resize the image using sharp
    //   const resizedImage = await sharp(image)
    //     .resize(size.width, size.height)
    //     .toBuffer();

    //   // Upload the resized image to S3
    //   await s3
    //     .putObject({
    //       Bucket: bucket,
    //       Key: `${resizedFolder}/${size.width}x${size.height}/${fileName}`,
    //       Body: resizedImage,
    //       ContentType: 'image/jpeg',
    //     })
    //     .promise();
    // };

    // // Generate an array of resized images with their presigned URLs
    // const resizedImages = sizes.map((size) => {
    //     const key = `${resizedFolder}/${size.width}x${size.height}/${fileName}`;
    //     const url = s3.getSignedUrl('getObject', { Bucket: bucket, Key: key, Expires: 60 * 60 });
    //     return { size: `${size.width}x${size.height}`, url };
    // });

    // TODO: Insert object into DB
        // Generate the pre-signed URL for the original image
    // const generatePresignedUrl = s3.getSignedUrl('getObject', {
    //     Bucket: bucket,
    //     Key: `${originalFolder}/${fileName}`,
    //     Expires: 60 * 60, // the URL will be valid for 1 hour
    //   });

    // Create an object with the original image data
    // const originalImageData = {
    //     bucketName: bucket,
    //     objectKey: uploadOriginal.Key,
    //     generatePresignedUrl,
    //     };

    // const objectData = {
    //     fileName: fileName,
    //     original: `${originalFolder}/${fileName}`,
    //     resized: sizes.map((size) => ({
    //       url: `${resizedFolder}/${size.width}x${size.height}/${fileName}`,
    //       width: size.width,
    //       height: size.height,
    //     })),
    //   };

    } catch (error) {
        return {
        statusCode: 500,
        body: JSON.stringify({
            message: `Image resizing and uploading failed`,
            error: error.message,
        }),
        };
    }
};

export const main = middyfy(resizer)
