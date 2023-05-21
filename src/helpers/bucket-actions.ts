import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { responses } from "src/helpers/api-responses";
import axios from "axios";


const region: string = process.env.REGION;
const s3 = new S3({region: region});

export const createPresignedUrlForPutRequest = async ({ bucket, key }) => {
    try {
        const command = new PutObjectCommand({ 
        Bucket: bucket, 
        Key: key, 
        });
        return await getSignedUrl(s3, command, { expiresIn: 6000 });
    } catch (err) {
        return responses._500({
            message: `Error generating presigned url`,
            error: err.message,
        })
    };  
};

export const createPresignedUrlForGetRequest = async ({ bucket, key }) => {
    try {
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        return await getSignedUrl(s3, command, { expiresIn: 6000 });
    } catch (err) {
        return responses._500({
            message: `Error generating presigned url`,
            error: err.message,
        })
    }
};

export const uploadPresignedObject =  async ({bucket, key}, buffer:Buffer) => {
    try {
        const presignedUrl = await createPresignedUrlForPutRequest({bucket, key})
        return await axios.put(presignedUrl, buffer);
    } catch (error) {
        return responses._500({
            message: `Image resizing and uploading failed`,
            error: error.message,
        });

    }
};

export const uploadJsonFile = async (data:object, bucket:string, key: string) => {
    const dataToString = JSON.stringify(data);
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: `${key}.json`,
        Body: dataToString
    });
    const response = await s3.send(command)
    console.log(`JSON creation response: ${response}`);
}

export const getObject = async ({bucket, key}) => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    return await s3.send(command)
};

export const deleteObject = async ({ bucket, key }) => {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return await s3.send(command);
  };







