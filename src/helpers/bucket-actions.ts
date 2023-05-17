import { GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { responses } from "./api-responses";
import axios from 'axios'
const region = process.env.region
const s3 = new S3({region: region});


export const createPresignedUrlForPutRequest = ({ region, bucket, key }) => {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn: 6000 });
};


export const createPresignedUrlForGetRequest = ({ region, bucket, contentType, key }) => {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn: 6000 });
};


export const getObject = ({bucket, key}) => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    return command
};


export const uploadPresignedObject =  async ({region, bucket, contentType, key}, buffer:Buffer) => {
    try {
        const presignedUrl = await createPresignedUrlForPutRequest({region, bucket, key})
        return await axios.put(presignedUrl, buffer, {
            headers: {
                'Content-Type': contentType,
            },
        });

    } catch (error) {
        return responses._500({
            message: `Image resizing and uploading failed`,
            error: error.message,
        });

    }
};




