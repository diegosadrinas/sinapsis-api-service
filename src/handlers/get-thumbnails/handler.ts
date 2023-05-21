import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createPresignedUrlForGetRequest, getObject, responses, streamToString } from "src/helpers";
import { Readable } from "stream";


// Define the bucket name
const bucket: string = process.env.BUCKET_NAME;
const region: string = process.env.REGION
const destinationFolder: string = process.env.THUMBNAILS_FOLDER

// Define the handler function
const getThumbnailsUrl = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Get the object key from the request
        const objectKey = event.queryStringParameters?.key;
        const bucketParams = {
            region: region,
            bucket: bucket,
            key: ``,
        };

        // Check if the object key is valid
        if (!objectKey) {
            return responses._400({
                message: 'Missing key on request. Unable to get thumbnails by key'
            })
        };

        // Checks if there is an Error file in the bucket.
        const errorFileKey = `${objectKey}.json`
        try {
            const checkErrorMessage = await getObject({bucket, key: errorFileKey})
            if (checkErrorMessage.Body) {
                const body = checkErrorMessage.Body as Readable;
                const data = await streamToString(body);
                const json = JSON.parse(data)
                return responses._404({ message: json.message })
            }
        } catch (error) {
            // This will get by the error if there is no json object, passing to the next block.
        }

        // Create the parameters for calling getObject
        const proportions: string[]= ['large', 'medium', 'small']
        const urlsForDownload: string[] = []

        await Promise.all(proportions.map(async (proportion) => {
            const fileKey: string = `${proportion}-${objectKey}`
            const params = {
                ...bucketParams,
                key: `${destinationFolder}/${fileKey}`,
            };
            const { Body } = await getObject(params);

            // Check if the object exists in the bucket
            if (!Body) {    
                return responses._404({
                    message: 'Unable to retrieve object. Object not found.'
                })
            };

            // Generate presigned_urls for download
            const presignedUrlForDownload = await createPresignedUrlForGetRequest(params);
            urlsForDownload.push(presignedUrlForDownload)

        }));

        // Return a successful response with the object body
        return responses._200({
            message: `Presigned Url for download thumbnails successfully generated`, 
            data: urlsForDownload 
        })
    } catch (error) {
        return responses._500({
            message: `Error generating presigned url`,
            error: error.message,
        });
    }
};

export const main = getThumbnailsUrl;