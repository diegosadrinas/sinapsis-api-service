import { middyfy } from '@libs/lambda';
import { v4 as uuid } from 'uuid';
import { responses, createPresignedUrlForPutRequest } from '../../helpers';
const region = process.env.region;
const bucket = process.env.BUCKET_NAME;
const originalFolder = 'original';
const presignedUrlGenerator = async (event) => {
    try {
        console.log(`Entered in Url generator Handler...`);
        const bucketParams = {
            region: region,
            bucket: bucket,
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
export const main = middyfy(presignedUrlGenerator);
//# sourceMappingURL=handler.js.map