const request = require('supertest');
const app = require('../Src/app');

describe('Addresses API', () => {
    const userPayload = {
        username: 'address_user_1',
        email: 'address_user1@example.com',
        password: 'Passw0rd!23',
        fullname: { firstname: 'Address', lastname: 'User' }
    }

    const address1 = {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        pin_code: '62704',
        country: 'USA',
        phone: '1234567890'
    }

    const address2 = {
        street: '456 Elm St',
        city: 'Springfield',
        state: 'IL',
        pin_code: '62705',
        country: 'USA',
        phone: '1234567891',
        isDefault: true
    }

    async function registerAndLogin() {
        // Register
        await request(app).post('/api/auth/register').send(userPayload).expect(201);
        // Login
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ identifier: userPayload.username, password: userPayload.password });
        expect(loginRes.status).toBe(200);
        const cookies = loginRes.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const tokenCookie = cookies.find(c => c.startsWith('token='));
        expect(tokenCookie).toBeDefined();
        return tokenCookie;
    }

    it('GET /api/auth/users/me/addresses - returns addresses array for authenticated user', async () => {
        const tokenCookie = await registerAndLogin();

        // Add two addresses
        await request(app).post('/api/auth/users/me/addresses').send(address1).set('Cookie', tokenCookie).expect(201);
        await request(app).post('/api/auth/users/me/addresses').send(address2).set('Cookie', tokenCookie).expect(201);

        const res = await request(app)
            .get('/api/auth/users/me/addresses')
            .set('Cookie', tokenCookie)
            .expect(200);

        expect(res.body.addresses).toBeDefined();
        expect(Array.isArray(res.body.addresses)).toBe(true);
        expect(res.body.addresses.length).toBe(2);
        // Check that one of the addresses is marked as default (address2)
        const defaults = res.body.addresses.filter(a => a.isDefault === true);
        expect(defaults.length).toBe(1);
        expect(defaults[0].street).toBe(address2.street);
    });

    it('POST /api/auth/users/me/addresses - creates address with payload validation', async () => {
        const tokenCookie = await registerAndLogin();

        // Valid request
        const createRes = await request(app)
            .post('/api/auth/users/me/addresses')
            .send(address1)
            .set('Cookie', tokenCookie);
        // test status
        expect(createRes.status).toBe(201);

        expect(createRes.body.address).toBeDefined();
        expect(createRes.body.address.street).toBe(address1.street);
        expect(createRes.body.address.pin_code).toBe(address1.pin_code);
        expect(createRes.body.address.phone).toBe(address1.phone);

        // First address should become default true automatically
        const getRes = await request(app)
            .get('/api/auth/users/me/addresses')
            .set('Cookie', tokenCookie)
            .expect(200);
        expect(getRes.body.addresses[0].isDefault).toBe(true);

        // Invalid pin_code (non-numeric) should return 400
        const invalidPinPayload = { ...address1, pin_code: 'abcd' };
        await request(app)
            .post('/api/auth/users/me/addresses')
            .send(invalidPinPayload)
            .set('Cookie', tokenCookie)
            .expect(400);

        // Invalid phone should return 400 (phone expects a mobile phone format)
        const invalidPhonePayload = { ...address1, phone: 'not-a-phone' };
        await request(app)
            .post('/api/auth/users/me/addresses')
            .send(invalidPhonePayload)
            .set('Cookie', tokenCookie)
            .expect(400);
    });

    it('POST with isDefault true unsets previous defaults', async () => {
        const tokenCookie = await registerAndLogin();

        // Create first address (becomes default)
        const res1 = await request(app).post('/api/auth/users/me/addresses').send(address1).set('Cookie', tokenCookie).expect(201);
        expect(res1.body.address.isDefault).toBe(true);

        // Create second address with isDefault true, this should unset first default and set second as default
        const res2 = await request(app).post('/api/auth/users/me/addresses').send(address2).set('Cookie', tokenCookie).expect(201);
        expect(res2.body.address.isDefault).toBe(true);

        const getRes = await request(app).get('/api/auth/users/me/addresses').set('Cookie', tokenCookie).expect(200);
        const defaults = getRes.body.addresses.filter(a => a.isDefault === true);
        expect(defaults.length).toBe(1);
        expect(defaults[0]._id).toBe(res2.body.address._id);
    });

    it('DELETE /api/auth/users/me/addresses/:addressid - deletes address and returns expected responses', async () => {
        const tokenCookie = await registerAndLogin();

        // Add address
        const createRes = await request(app).post('/api/auth/users/me/addresses').send(address1).set('Cookie', tokenCookie).expect(201);
        const addrId = createRes.body.address._id;

        // Confirm it exists
        let getRes = await request(app).get('/api/auth/users/me/addresses').set('Cookie', tokenCookie).expect(200);
        expect(getRes.body.addresses.length).toBe(1);

        // Delete it
        const delRes = await request(app).delete(`/api/auth/users/me/addresses/${addrId}`).set('Cookie', tokenCookie).expect(200);
        expect(delRes.body.message).toBe('address removed');

        // Confirm it's removed
        getRes = await request(app).get('/api/auth/users/me/addresses').set('Cookie', tokenCookie).expect(200);
        expect(getRes.body.addresses.length).toBe(0);

        // Deleting a non-existent address returns 404
        await request(app).delete(`/api/auth/users/me/addresses/${addrId}`).set('Cookie', tokenCookie).expect(404);
    });
});
