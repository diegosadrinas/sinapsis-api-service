
export const responses = {
    _response(statusCode = 502, data = {}) {
        return {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Origin': '*',
            },
            statusCode,
            body: JSON.stringify(data),
        };
    },
    _200(data = {}) {
        return this._response(200, data);
    },

    _400(data = {}) {
        return this._response(400, data);
    },
    _404(data = {}) {
        return this._response(404, data);
    },
    _500(data = {}) {
        return this._response(500, data);
    }
}
