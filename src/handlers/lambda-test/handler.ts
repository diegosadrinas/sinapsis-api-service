import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';


const test: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  return formatJSONResponse({
    message: `Hello, ${event.body.name} welcome to the exciting Serverless world!. 
    This is the bucket name: ${process.env.BUCKET_NAME}`,
    event,
  });
};

export const main = middyfy(test);