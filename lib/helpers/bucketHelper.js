import { GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import axios from 'axios';
const region = process.env.region;
const s3 = new S3({ region: region });
const createPresignedUrlForPutRequest = ({ region, bucket, contentType, key }) => {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
};
export const createPresignedUrlForGetRequest = ({ region, bucket, contentType, key }) => {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
};
export const uploadPresignedObject = async ({ region, bucket, contentType, key }, buffer) => {
    try {
        const presignedUrl = await createPresignedUrlForPutRequest({ region, bucket, contentType, key });
        return await axios.put(presignedUrl, buffer, {
            headers: {
                'Content-Type': contentType,
            },
        });
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `Image resizing and uploading failed`,
                error: error.message,
            }),
        };
    }
};
//# sourceMappingURL=bucketHelper.js.map