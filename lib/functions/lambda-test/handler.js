import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
const test = async (event) => {
    return formatJSONResponse({
        message: `Hello, welcome to the exciting Serverless world!`,
        event,
    });
};
export const main = middyfy(test);
//# sourceMappingURL=handler.js.map