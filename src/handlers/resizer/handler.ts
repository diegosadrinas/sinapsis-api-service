import Jimp from 'jimp'
import * as fileType from 'file-type';
import { S3Event, S3Handler } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import { Buffer } from 'buffer';
import { v4 as uuid } from 'uuid';
import { HeadBucketCommand, HeadObjectCommand, S3 } from "@aws-sdk/client-s3";
import { 
    createPresignedUrlForGetRequest, 
    uploadPresignedObject,
    getObject,
    responses 
} from '../../helpers'


// Define the S3 bucket and folder names
const region: string = process.env.region
const bucket: string = process.env.BUCKET_NAME;
const originalFolder: string = 'original';
const resizedFolder: string = 'resized';
const s3 = new S3({region: region});


// Define the image variables
const maxFileSize: number = parseInt(process.env.MAX_FILE_SIZE)
const validFormats: string[] = ['jpg', 'jpeg', 'png'];
const sizes: object[] = [
    { width: 400, height: 300 },
    { width: 160, height: 120 },
    { width: 120, height: 120 },
  ];


const resizer: S3Handler = async (event: S3Event) => {
    try {
        // --------------------------------------------------------------------------------------
        // Comentarios de Diego:  
        //  1. Por que no poner el mime directamente como content type. 
        //  2. Sacar el one liner y que el mime type sea ese salvo que esté la E. 
        //  3. Hacer un try/catch por cada acción importante, como upload.

        console.log(`Entered in Resize Handler...`)

        // Get the uploaded object:
        try {
            const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));;
            const bucket = event.Records[0].s3.bucket.name;
            const params = await s3.send(new HeadObjectCommand({ Bucket:bucket, Key:key }))
            console.log(`Params: ${params}`)
            const image = getObject({key, bucket})
            console.log(`Body keys: ${Object.keys(image)}`)
            return responses._200({message: 'Image resized and uploaded successfully', data: `Body keys: ${Object.keys(image)}`  });    


        } catch (error) {
            return responses._500({
                message: `Error getting S3 Object. Operation failed.`,
                error: error.message,
            });
        }





    //     if (!event.body) {
    //         return responses._400({ message: 'Incorrect body on request' })
    //     }
        
    //     const buffer = Buffer.from(event.body, 'base64');
    //     const contentType = event.headers['Content-Type'];
    //     const fileExt = contentType.split('/').pop();
    //     const bucketParams = {
    //         region: region,
    //         bucket: bucket,
    //         contentType: event.headers['Content-Type'],
    //         key: `${originalFolder}/${uuid()}`  
    //     };

    //     // Check if the image is in a valid format
    //     if (!validFormats.includes(fileExt)) {
    //         return responses._400({ message: 'Invalid image type. Only JPEG and PNG files are allowed' })
    //     }
    // // Check if the image file size is valid
    //     if (buffer.length > maxFileSize) { 
    //         return responses._400({ message: 'File size too large. Max file size allowed is 11mb.' })
    //     };
    
    //     await uploadPresignedObject(bucketParams, buffer)
    //     console.log("Image as binary uploaded")

// -----------------------------------------------------------------------------------------------------------------

        // const rawBuffer2 = Buffer.from(event.body, 'base64')
        // const rawBucketParams2 = {
        //     region: region,
        //     bucket: bucket,
        //     contentType: 'image/jpeg',
        //     key: `${originalFolder}/${uuid()}`  
        // };
        // await uploadPresignedObject(rawBucketParams2, rawBuffer2)
        // console.log("Image as base64 uploaded")

        // const parsedData = lambdaMultipartParser.parse(event);
        // console.log(`Parsed event Keys: ${Object.keys(event)}\n 
        // Parsed File Keys: ${Object.keys(parsedData.file)}\n
        // `)

        // Check if body is empty or missing file
        // if (!event.body) {
        //     return responses._400({ message: 'Incorrect body on request' })
        // }

    // Get the file properties and buffer
        // const { type, contentType, filename, content } = parsedData.file;
        // const fileExt: string = filename.split('.').pop();
        // const fileKey: string = `${uuid()}.${fileExt}`
        // const buffer = Buffer.from(content, 'binary')
        // const bucketParams = {
        //     region: region,
        //     bucket: bucket,
        //     contentType: contentType,
        //     key: `${originalFolder}/${fileKey}`  
        // };
        // console.log(`Name: ${filename}, \nType: ${type}, \ncontent Type: ${contentType}, \nExtension: ${fileExt}`);

    // // Check if the image is in a valid format
    //     if (!validFormats.includes(fileExt)) {
    //         return responses._400({ message: 'Invalid image type. Only JPEG and PNG files are allowed' })
    //     }
    // // Check if the image file size is valid
    //     if (buffer.length > maxFileSize) {
    //         return responses._400({ message: 'File size too large. Max file size allowed is 11mb.' })
    //     };


    //     await uploadPresignedObject(bucketParams, buffer)
// -----------------------------------------------------------------------------------------------------------------

        // Resize main logic
        // const mimeType = fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' : 'image/png'
        // const urlsForDownload: string[] = []
        // const jimpImage = await Jimp.read(buffer)
        
        // await Promise.all(sizes.map(async ({ width, height }) => {
        //     const fileKey: string = `${uuid()}.${fileExt}`
        //     const resizedImage = jimpImage.clone();
        //     resizedImage.resize(width, height);
        //     const resizedBuffer = await resizedImage.getBufferAsync(mimeType);
        //     const resizedBucketParams = {
        //         ...bucketParams,
        //         key: `${resizedFolder}/${fileKey}`  
        //     };
        
        //     const presignedUrlForDownload = await createPresignedUrlForGetRequest(resizedBucketParams);
        //     urlsForDownload.push(presignedUrlForDownload)

        //     await uploadPresignedObject(resizedBucketParams, resizedBuffer)    
        // }));

        // return responses._200({message: `Image resized and uploaded successfully`, data: urlsForDownload });    
    } catch (error) {
        return responses._500({
            message: `Image resizing and uploading failed`,
            error: error.message,
        });
    };
};

export const main = middyfy(resizer);
