const crypto = require('crypto');
const https = require('https');
const dateFormat = require('dateformat');

const HOST = 'be.huobi.com';
const LANG = 'zh-CN'

class ApiError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
};

class ApiNetworkError extends ApiError {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
};

class ApiClient {
    constructor(accessKeyId, accessKeySecret, host = HOST) {
        this.accessKeyId = accessKeyId;
        this.accessKeySecret = accessKeySecret;
        this.host = host;
    }

    get(path, callback) {
        let qs = this.sign('GET', path, this.utc());
        return this.call('GET', path + '?' + qs, null, callback);
    }

    post(path, params, callback) {
        let qs = this.sign('POST', path, this.utc());
        let data = params && JSON.stringify(params).toString('utf8');
        return this.call('POST', path + '?' + qs, data, callback);
    }

    sign(method, path, ts, params) {
        if (!params) {
            params = {};
        }

        params['SignatureMethod'] = 'HmacSHA256';
        params['SignatureVersion'] = '2';
        params['AccessKeyId'] = this.accessKeyId;
        params['Timestamp'] = ts;

        let self = this;

        let keys = Object.keys(params).sort();

        let qs = keys.map(function(key) {
            return key + "=" + self.encode(params[key]);
        }).join('&');

        let payload = method + '\n' + this.host + '\n' + path + '\n' + qs;

        let sig = this.encode(crypto.createHmac('sha256', this.accessKeySecret).update(payload).digest('base64'));

        qs = qs + '&Signature=' + sig;

        return qs;
    }

    call(method, uri, data, callback) {
        let url = "https://" + this.host + uri;
        console.log(method + ' ' + url);

        let headers = {};
        headers['Accept'] = 'application/json';
        headers['Accept-Language'] = LANG;

        if (method === 'POST') {
            headers['Content-Type'] = 'application/json';
        }

        let options = {
            host: this.host,
            path: uri,
            method: method,
            headers: headers,
        };

        let self = this;

        let req = https.request(options, function(res) {
            if (res.statusCode !== 200) {
                throw new ApiNetworkError('Bad response code: ' + res.statusCode);
            }
            res.on('data', data => {
                callback && callback(self.parse(data.toString('utf8')));
            });
        });

        data && req.write(data);

        req.end();
    }

    parse(text) {
        let result = JSON.parse(text)
        if ('status' in result && result.status === 'ok') {
            return result.data;
        }
        throw new ApiError(result['err-code'] + ': ' + result['err-msg']);
    }

    encode(s) {
        return encodeURIComponent(s);
    }

    utc() {
        return dateFormat(Date(), "yyyy-mm-dd'T'HH:MM:ss", true);
    }
};

exports.ApiClient = ApiClient;