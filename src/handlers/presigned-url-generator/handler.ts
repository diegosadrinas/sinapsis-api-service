import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import { v4 as uuid } from 'uuid';
import { 
    responses,
    createPresignedUrlForPutRequest
} from '../../helpers'


// Define the S3 bucket and folder names
const region = process.env.region
const bucket = process.env.BUCKET_NAME;
const originalFolder = 'original';

const presignedUrlGenerator: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    try {
        // --------------------------------------------------------------------------------------
        // Comentarios de Diego:  
        //  1. Por que no poner el mime directamente como content type. 
        //  2. Sacar el one liner y que el mime type sea ese salvo que esté la E. 
        //  3. Hacer un try/catch por cada acción importante, como upload.

        console.log(`Entered in Url generator Handler...`)
        console.log(`Event headers: ${Object.keys(event)}\n Event Body: ${event.body}`)
        const bucketParams = {
            region: region,
            bucket: bucket,
            key: `${originalFolder}/${uuid()}`  
        };

        const presignedUrl = await createPresignedUrlForPutRequest(bucketParams)

       
        return responses._200({
            message: `Presigned Url for Put request successfully generated`, 
            data: presignedUrl 
        });    
    } catch (error) {
        return responses._500({
            message: `Error generating presigned url`,
            error: error.message,
        });
    };
};

export const main = middyfy(presignedUrlGenerator);
