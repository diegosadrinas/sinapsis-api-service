import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
const test = async (event) => {
    return formatJSONResponse({
        message: `Hello, ${event.body.name}. This is an image resize service.`,
        event,
    });
};
export const main = middyfy(test);
//# sourceMappingURL=handler.js.map