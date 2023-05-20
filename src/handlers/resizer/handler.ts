import Jimp from 'jimp'
import {S3Client, GetObjectCommand} from '@aws-sdk/client-s3';
import { S3Event, S3Handler } from 'aws-lambda';
import { Readable } from 'stream';
import { createPresignedUrlForGetRequest, uploadPresignedObject, streamToBuffer } from 'src/helpers';
import { uploadJsonFile } from 'src/helpers/bucket-actions';


type params = {
    region: string;
    bucket: string;
    key: string;
};

const s3: S3Client = new S3Client({region: process.env.region});
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
        const bucket = event.Records[0].s3.bucket.name;
        const originalKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        const editedKey = originalKey.replace(`${process.env.ORIGINAL_IMAGE_FOLDER}/`, '')
        const command =  new GetObjectCommand({Bucket: bucket, Key: originalKey});
        const { Body, ContentType, ContentLength } = await s3.send(command)
        const fileExt = ContentType.split('/').pop();

        // file validation logic:
        if (!validFormats.includes(fileExt)) {
            const data: object = { message: "Invalid file type. Only JPEG and PNG files are allowed." }
            return uploadJsonFile(data, bucket, editedKey)
        }

        if (ContentLength > maxFileSize ) {
            const data: object = { message: "Invalid file size. Maximum size allowed is 11mb." }
            return uploadJsonFile(data, bucket, editedKey)
        }


        // TODO:
        // 2- Evaluar incluir toda la lógica dentro de un file-validor helper.
        // 3- Falta validar el evento de un Body vacío.

        const body = Body as Readable
        const buffer = await streamToBuffer(body);

        const urlsForDownload: string[] = []
        const jimpImage = await Jimp.read(buffer)

        // resize main logic
        await Promise.all(sizes.map(async ({ width, height, proportion }) => {
            const fileKey: string = `${proportion}-${editedKey}`
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
            urlsForDownload.push(presignedUrlForDownload)

            await uploadPresignedObject(resizedBucketParams, resizedBuffer)  
        }));

    } catch  {
        const message = `Error processing S3 Handler.`;
        throw new Error(message);
    }
};

export const main = resizer;