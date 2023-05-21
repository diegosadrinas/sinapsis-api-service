import { uploadJsonFile } from "./bucket-actions"


export const isValidFile = async (
    formats: string[], 
    extension: string, 
    bucket: string, 
    editedKey: string, 
    contentLength: number,
    maxFileSize: number) => {

    if (contentLength === 0) {
        const data: object = { message: "Invalid request. No file was received." }
        await uploadJsonFile(data, bucket, editedKey)
        return false
    };

    if (!formats.includes(extension)) {
        const data: object = { message: "Invalid file type. Only JPEG and PNG files are allowed." }
        await uploadJsonFile(data, bucket, editedKey)
        return false
    };
    
    if (contentLength > maxFileSize ) {
        const data: object = { message: "Invalid file size. Maximum size allowed is 11mb." }
        await uploadJsonFile(data, bucket, editedKey)
        return false
    };

    return true;

};
