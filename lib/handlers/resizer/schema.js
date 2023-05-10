export default {
    type: "object",
    properties: {
        name: { type: "string" },
        body: {
            type: 'string',
            pattern: '^[A-Za-z0-9+/=]+$'
        },
    },
    required: ['name', 'body']
};
//# sourceMappingURL=schema.js.map