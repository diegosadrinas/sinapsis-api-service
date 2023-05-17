export const inputSchema = {
    type: 'object',
    properties: {
      event: {
        type: 'object',
        properties: {
          headers: {
            type: 'object',
            additionalProperties: false,
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
    required: ['event', 'context'],
    additionalProperties: false,
  };
  