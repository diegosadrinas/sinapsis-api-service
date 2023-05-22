# Thumbnail API

Thumbnail API is a simple API that generates thumbnails from a source image. It accepts PNG and JPEG files up to 11 MB in size and returns three new images with the following dimensions: 400x300, 160x120, and 120x120.

  
## Table of Contents

  

-  [Installation](#installation)

-  [Usage](#usage)



## Installation

  To install and run this project, you need to have Node.js 18.x and Serverless Framework installed on your machine. You also need to have an AWS account and configure your credentials for Serverless Framework.

### AWS account permissions
You need to have the needed persmissions before running sls deploy, since the serverless framework does not add any permissions to the user. 
These are the policies that you need to attach to your IAM user before deploying, otherwise it will fail:
-   `cloudformation:*`
-   `iam:*`
-   `lambda:*`
-   `apigateway:*`
-   `s3:*`
-   `logs:*`

You can create a custom JSON file policy that grants these permissions and attach it to your IAM user. Alternatively, you can use the AWS managed policy  `arn:aws:iam::aws:policy/AWSLambda_FullAccess`  that covers most of these permissions, except for  `cloudformation:*`  and  `s3:*`, which you need to add separately.

### Deploying
To install the project dependencies, run the following command in the project root directory:
  ```bash
npm  install
```

To deploy the project to AWS, run the following command:
```bash
serverless  deploy
```
This will create an S3 bucket and three Lambda functions with API Gateway endpoints. You can find the endpoint URLs in the output of the command.


## Usage

The API provides two endpoints: one for getting a presigned URL for uploading an image to S3, and one for getting presigned URLs for downloading thumbnail images.

  
### Getting a presigned URL for uploading an image

To get a presigned URL for uploading an image to S3, make a GET request to the /upload endpoint. In this case no params are needed. For example:

```bash
curl  https://<api-url>/upload
```

The response will be a JSON object with a url property that contains a presigned URL for uploading the image to S3. For example:

```json
{
"message":  "Presigned Url for Put request successfully generated",
"key":  "237d8fbf-49dd-484a-a94f-d67eddc51aaa",
"data":  "https://thumbnail-api-service-bucket.s3.us-east-1.amazonaws.com/original/...id=PutObject"
}
```
Keep in mind that the presigned-url has a expiration time of 10 minutes. After that the access will be denied.

### Uploading an image using the presigned URL
To upload an image using the presigned URL, make a PUT request to the URL with the image file in the body as a binary. For example:
```bash
curl -X PUT -T --data-binary my-image.jpg https://thumbnail-api-service-bucket.s3.amazonaws.com/original/my-image.jpg?AWSAccessKeyId=AKIA...&Expires=163...&Signature=...
```
The response will be an empty body with a status code of 200 if the upload was successful.

### Getting presigned URLs for downloading thumbnail images

To get presigned URLs for downloading thumbnail images, make a GET request to the /download endpoint with a query parameter key that specifies the key received in the first request. For example:
```bash
  curl https://<api-url>/download?key=uuid-key-received
```
The response will be a JSON object with three properties: small, medium, and large, each containing a URL for downloading a thumbnail image with different dimensions. For example:

  
```json
{
"small": "https://thumbnail-api-service-bucket.s3.amazonaws.com/resize/120x120/my-image.jpg",
"medium": "https://thumbnail-api-service-bucket.s3.amazonaws.com/resize/160x120/my-image.jpg",
"large": "https://thumbnail-api-service-bucket.s3.amazonaws.com/resize/400x300/my-image.jpg"
}
```

### Downloading a thumbnail image using one of the presigned URLs

To download a thumbnail image using one of these URLs, make a GET request to the URL, or simply enter the url in your browser. For example:
```bash
curl https://thumbnail-api-service-bucket.s3.amazonaws.com/resize/120x120/my-image.jpg -o my-image-small.jpg
``` 
The response will be the thumbnail image file if it exists, or an error message if it does not.


## API diagram overview
[![](https://mermaid.ink/img/pako:eNptkstqwzAQRX9l0CqBhBB750WhbUpocNuQx6Z4M4nGtqglGVluSEP-vZId59HGBjMaru5cH-bAtpoTi1hmsMwhXiQK3LOuyPSeC0HK9mE4hOnLCtZloZG70wM8zl-nPfeBKVra4b7fdONxL0a54Qh1I-23XvHYO8wNVSJTxGG9iCHV5iQSKhtAZdHW1dm6vecrf_M0F2bLj_dG4sNdYjbm6xUIiRldh1yGvWUIT_X2i-wpYNAFXLgwP2R8uy0BFYet0SXshM1hJmQJo2YiGaPNSKhvLASHVBTUua_yWm4UiqLqptym8tBgonfqhltwB1zY5erUHbrwPjreyDy7q4wgqaocg384gwvPwPudI_0h6l8ANmCSjETB3VYcfCdhNidJCYtcySnFurAJS9TRSbG2erlXWxZZU9OA1SV3fzYR6PZJsijFonLdEtWn1pczcWG1eWs3r1nA4y8dnMj4?type=png)](https://mermaid-js.github.io/mermaid-live-editor/edit#pako:eNptkstqwzAQRX9l0CqBhBB750WhbUpocNuQx6Z4M4nGtqglGVluSEP-vZId59HGBjMaru5cH-bAtpoTi1hmsMwhXiQK3LOuyPSeC0HK9mE4hOnLCtZloZG70wM8zl-nPfeBKVra4b7fdONxL0a54Qh1I-23XvHYO8wNVSJTxGG9iCHV5iQSKhtAZdHW1dm6vecrf_M0F2bLj_dG4sNdYjbm6xUIiRldh1yGvWUIT_X2i-wpYNAFXLgwP2R8uy0BFYet0SXshM1hJmQJo2YiGaPNSKhvLASHVBTUua_yWm4UiqLqptym8tBgonfqhltwB1zY5erUHbrwPjreyDy7q4wgqaocg384gwvPwPudI_0h6l8ANmCSjETB3VYcfCdhNidJCYtcySnFurAJS9TRSbG2erlXWxZZU9OA1SV3fzYR6PZJsijFonLdEtWn1pczcWG1eWs3r1nA4y8dnMj4)

Let's break down the graph into simple steps:

1. The user makes a GET request to the API Gateway -/upload-, which redirects it to the Upload Lambda function. 
2. The upload function returns a JSON response that contains: a) A presigned-url for an S3 bucket PUT request; b) a unique UUID key for identifying the image that will be uploaded by the user.
3. The user makes a PUT request with the image as a binary directly to the S3 bucket using the presigned-url.
4. The upload triggers an S3 Event, that conducts to a Lambda function (Resizer). Then, the lambda will follow this process: 
	* If the file is a valid format and the size is less than 11mb, then it will proceed to resize the image into three different thumbnails that will be store in a separate folder (*resize/*), with the *size-key* as a file name. The original file will be stored in the *original/* folder.
	* If the file is in an invalid format or size, then a JSON file is created, storing the error message that the user will receive in the later request for downloading the thumbnails. Then the lambda proceeds to delete the invalid file.
5. The user makes a GET request to the API gateway -/download-, which redirects it to the Download lambda function.
6. The download function has two main responsbilities:
	*	Checks if a JSON file exists. If so, proceeds to get it from the bucket. Parses it and obtains the error message that will be return to the user as a response.
	*	If no JSON file is found, it generates three presigned-urls for downloading the thumbnails.
	*	Finally, a response with a status code and a message is return to the user. If an error JSON file was found, a 400 status code will be return, along with an error message. Otherwise, a 200 status code is return along with the three urls.
7.  Every object uploaded to the bucket has an availability period of 1 day due to the lifecycle policy attached to the bucket. After that availability period it is removed from the bucket.

## API Documentation
For a complete documentation on the requests/responses explained above, see the Postman Collection Documentation, available at: [Postman Thumbnail API Collection](https://documenter.getpostman.com/view/16895261/2s93m34PVr)

## Further implementations
There are several aspects or features that can be utterly improved and implemented. Here is a list of possible future implmentations:
- *Authorization*: Right now the API has a "too public" approach. These can lead to security issues, since now the endpoints are accessible for everyone, which means that anyone can trigger the lambdas that are facing to the public.
- *File limitation from the bucket*: Due to a problem with my AWS account, I couldn't apply BucketPolicies for restricting the type of files that can be uploaded to the bucket. This limitation lead me to implement a validation process in my backend, that evaluates the file format and utterly deletes it. 
- *Size limitation from the bucket*: The same thing happens with the size liimitation. Although it's been handled by the backend, a user can try to upload any size that his interface allows and the bucket can take. This can lead to several problems.
- *Database*: The error JSON file is arguably a solution in a more complex context. It is obvious that a DB -probably a relational DB to start- will handle the process more efficiently. It should store the unique KEY, the user (in case some kind of authorization was implemented), a status and an error message if there was one. This should make the whole process more agile and organic, without any need to do creation/deletion files request to the S3 bucket.