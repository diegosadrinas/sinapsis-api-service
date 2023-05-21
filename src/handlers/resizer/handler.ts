import Jimp from 'jimp'
import { S3Event, S3Handler } from 'aws-lambda';
import { Readable } from 'stream';
import { streamToBuffer } from 'src/helpers/stream-converter';
import { 
    getObject, 
    createPresignedUrlForGetRequest, 
    uploadPresignedObject, 
    deleteObject
} from 'src/helpers/bucket-actions';
import { isValidFile } from 'src/helpers/upload-validator';


type params = {
    region: string;
    bucket: string;
    key: string;
};

const destinationFolder: string = process.env.THUMBNAILS_FOLDER;
const validFormats: string[] = ['jpg', 'jpeg', 'png'];
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE)
const sizes: { width: number, height: number, proportion: string }[] = [
    { width: 400, height: 300, proportion: 'large' },
    { width: 160, height: 120, proportion: 'medium' },
    { width: 120, height: 120, proportion: 'small' },
  ];


const resizer: S3Handler = async (event: S3Event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        // Set variables for file validation and file processing
        const bucket = event.Records[0].s3.bucket.name;
        const originalKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        const editedKey = originalKey.replace(`${process.env.ORIGINAL_IMAGE_FOLDER}/`, '')
        const { Body, ContentType, ContentLength } = await getObject({ bucket, key: originalKey})
        const fileExt = ContentType.split('/').pop();

        // Invoke file-validation handler
        const validUpload = await isValidFile(validFormats, fileExt, bucket, editedKey, ContentLength, maxFileSize);
        if (!validUpload ) { 
           await deleteObject({bucket, key: originalKey});
           return
        };
 
        // Set variables for resizing
        const body = Body as Readable;
        const buffer = await streamToBuffer(body);
        const urlsForDownload: string[] = [];
        const jimpImage = await Jimp.read(buffer);

        // resize logic
        await Promise.all(sizes.map(async ({ width, height, proportion }) => {
            const fileKey: string = `${proportion}-${editedKey}`;
            const resizedImage = jimpImage.clone();
            resizedImage.resize(width, height);
            const resizedBuffer = await resizedImage.getBufferAsync(ContentType);
            const resizedBucketParams: params = {
                region: process.env.region,
                bucket: bucket,
                key: `${destinationFolder}/${fileKey}`  
            };

            // generate presigned-urls and upload to bucket
            const presignedUrlForDownload = await createPresignedUrlForGetRequest(resizedBucketParams);
            urlsForDownload.push(presignedUrlForDownload);
            
            await uploadPresignedObject(resizedBucketParams, resizedBuffer);
        }));

    } catch  {
        const message = `Error processing S3 Handler.`;
        throw new Error(message);
    }
};

export const main = resizer;