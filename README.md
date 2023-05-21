# Thumbnail API

Thumbnail API is a simple API that generates thumbnails from a source image. It accepts PNG and JPEG files up to 11 MB in size and returns three new images with the following dimensions: 400x300, 160x120, and 120x120.

  
## Table of Contents

  

-  [Installation](#installation)

-  [Usage](#usage)



## Installation

  

To install and run this project, you need to have Node.js 14.x and Serverless Framework installed on your machine. You also need to have an AWS account and configure your credentials for Serverless Framework.

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