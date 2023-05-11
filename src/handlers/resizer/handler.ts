import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import 'source-map-support/register';
import { Buffer } from 'buffer';
import { GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from 'uuid';
const multipart = require('parse-multipart-data')
import * as lambdaMultipartParser from 'aws-lambda-multipart-parser';
import Jimp from 'jimp'
import { contentType } from 'mime-types';
import axios from 'axios'



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
        console.log(`Keys: ${Object.keys(parsedData)}`)
        const file = parsedData.image;

        // Get the file name and extension
        const fileName = file.filename;
        const fileExt = fileName.split ('.').pop ();
        // // console.log(`Headers: ${Object.keys(event.headers)} \n Type: ${file.type}, content Type: ${file.contentType} , \n Extension: ${fileExt}`);
        console.log(`Keys: ${Object.keys(parsedData)}\n File Keys: ${Object.keys(file)}`);

        const buffer = Buffer.from(file.content, 'binary')
        console.log(`Buffer: ${buffer.length}`)


        const createPresignedUrlWithClient = ({ region, bucket, contentType, key }) => {
            const command = new PutObjectCommand({ Bucket: bucket, Key: key });
            return getSignedUrl(s3, command, { expiresIn: 3600 });
        };
        
        const imagePresignedUrl = await createPresignedUrlWithClient({
            region: region,
            bucket: bucket,
            contentType: file.contentType,
            key:  `${originalFolder}/${uuid()}`,
        });

        console.log(`Presigned URL with client: ${imagePresignedUrl}`);

        
        // Upload the file to S3 using the presigned URL
        const putObjectResponse = await axios.put(imagePresignedUrl, Buffer.from(file.content, 'binary'), {
            headers: {
                'Content-Type': file.contentType,
            },
            });
        // const objectFileName = `${uuid()}.${fileExt}`;;

        // const jimpImage = await Jimp.read(decodedContent)
        // const convertedImageBuffer = await jimpImage.getBufferAsync(Jimp.MIME_JPEG);




        // Get the image file from the event body
        
        // const image = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
        // const base64File =Buffer.from(event.body, 'base64')
        // const payload = Buffer.from(event.body, 'base64');
        // const boundary = event.headers['Content-Type'].split('=')[1];
        // const parts = multipart.parse(base64File, boundary);


        // console.log(`Payload: ${Object.keys(event.headers)}, Parts: ${parts}, Decoded File: ${parts}`)
    // -------------------------------------------------------------------------------------------------------------
        // for (const part of parts) {
        //     const contentType = part.type;
        //     console.log(`Part Keys: ${Object.keys(part)}`);
        //     console.log(`Content-Type: ${contentType}`)
        //     if (!contentType.includes('image')) {
        //         return {
        //             statusCode: 400,
        //             body: JSON.stringify({
        //                 message: 'Invalid content type. Expected an image.'
        //             })
        //         };
        //     } 
            
        //     // // Check if the image is in a valid format
        //     const format = contentType.replace('image/', '');
        //     console.log(`Format: ${format}`)
        //     if (!validFormats.includes(format)) {
        //         return {
        //         statusCode: 400,
        //         body: JSON.stringify({ message: 'Invalid image type. Only JPEG and PNG files are allowed' }),
        //         };
        //     }
        //     //  // Check if the image file size is valid
        //     console.log(`Length: ${image.length}`)
        //     if (image.length > parseInt(maxFileSize)) {
        //         return {
        //             statusCode: 400,
        //             body: JSON.stringify({
        //                 message: 'File size too large. Max file size allowed is 11mb.'
        //             })
        //         };
        //     };
        
        //     // // Generate a random file name
        //     const partFileName = `${uuid()}.${format}`;;

        //     const jimpImage = await Jimp.read(part.data)
        //     const convertedImageBuffer = await jimpImage.getBufferAsync(Jimp.MIME_JPEG);
        
        //     // Upload the original image to S3
        //     await s3
        //         .putObject({
        //         Bucket: bucket,
        //         Key: `${originalFolder}/${partFileName}`,
        //         Body: convertedImageBuffer,
        //         ContentType: contentType,
        //     });
        // }

        return {
            statusCode: 200,
            body: JSON.stringify({
            message: `Image resized and uploaded successfully`,
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

    // Return a success response
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify({
    //     message: `Image resized and uploaded successfully`,
    //     resizedImages
    //   }),
    // };

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
