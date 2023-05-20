import { middyfy } from '@libs/lambda';
import { v4 as uuid } from 'uuid';
import { responses, createPresignedUrlForPutRequest } from '../../helpers';
const region = process.env.region;
const bucket = process.env.BUCKET_NAME;
const originalFolder = process.env.ORIGINAL_IMAGE_FOLDER;
const presignedUrlForUpload = async (event) => {
    try {
        const bucketParams = {
            region: region,
            bucket: bucket,
            contentLength: parseInt(process.env.MAX_FILE_SIZE),
            contentType: 'image/jpeg|image/png',
            key: `${originalFolder}/${uuid()}`
        };
        const presignedUrl = await createPresignedUrlForPutRequest(bucketParams);
        return responses._200({
            message: `Presigned Url for Put request successfully generated`,
            data: presignedUrl
        });
    }
    catch (error) {
        return responses._500({
            message: `Error generating presigned url`,
            error: error.message,
        });
    }
    ;
};
export const main = middyfy(presignedUrlForUpload);
//# sourceMappingURL=handler.js.map