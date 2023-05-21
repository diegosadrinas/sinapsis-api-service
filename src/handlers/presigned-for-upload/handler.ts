import {  APIGatewayProxyHandler } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import { v4 as uuid } from 'uuid';
import { responses } from 'src/helpers/api-responses'
import { createPresignedUrlForPutRequest } from 'src/helpers/bucket-actions'

type uploadParams = {
    bucket: string;
    key: string;
}

// Define the S3 bucket and folder names
const bucket: string = process.env.BUCKET_NAME;
const originalFolder: string = process.env.ORIGINAL_IMAGE_FOLDER;

const presignedUrlForUpload: APIGatewayProxyHandler = async () => {
    try {
        const imageKey =uuid()
        const bucketParams: uploadParams = {
            bucket: bucket,
            key: `${originalFolder}/${imageKey}`  
        };

        const presignedUrl:string = await createPresignedUrlForPutRequest(bucketParams)
        return responses._200({
            message: `Presigned Url for Put request successfully generated`, 
            key: imageKey,
            url: presignedUrl 
        });    
    } catch (error) {
        return responses._500({
            message: `Error generating presigned url`,
            error: error.message,
        });
    };
};

export const main = middyfy(presignedUrlForUpload);
