const { ApiClient } = require('./hbsdk')

const API_KEY = 'your-api-key'
const API_SECRET = 'your-api-secret'

let client = new ApiClient(API_KEY, API_SECRET);

// get symbol
client.get('/v1/common/symbols', data => {
    console.log(data);
});

// get user info
client.get('/v1/users/user', data => {
    console.log(data);
});

// get all accounts
client.get('/v1/account/accounts', accounts => {
    console.log(accounts);

    accounts.forEach(function(account) {
        // create order
        client.get('/v1/account/accounts/' + account.id + '/balance', data => {
            console.log(data);
        });
    });

    let accountId = accounts[0].id;

    // create order
    client.post('/v1/order/orders', {
        'account-id': accountId,
        'amount': '0.02',
        'price': '1020.21',
        'symbol': 'ethcny',
        'type': 'buy-limit',
        'source': 'api'
    }, orderId => {
        console.log(orderId);

        // place order
        client.post('/v1/order/orders/' + orderId + '/place', null, () => {

            // get order details
            client.get('/v1/order/orders/' + orderId, orderInfo => {
                console.log(orderInfo);
            });

            // cancel order:
            client.post('/v1/order/orders/' + orderId + '/submitcancel', null, () => {
                // get order details
                client.get('/v1/order/orders/' + orderId, orderInfo => {
                    console.log(orderInfo);
                });
            });
        });
    });
});