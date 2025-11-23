const request = require('supertest');
const app = require('../Src/app');

describe('GET /api/auth/logout', () => {
    const userPayload = {
        username: 'logout_user_1',
        email: 'logout_user_1@example.com',
        password: 'Password123',
        fullname: { firstname: 'Logout', lastname: 'User' }
    }

    it('clears cookie and returns 200 when user is logged in', async () => {
        // register and log in
        await request(app).post('/api/auth/register').send(userPayload).expect(201);

        const loginRes = await request(app).post('/api/auth/login').send({
            identifier: userPayload.username,
            password: userPayload.password
        }).expect(200);

        const cookies = loginRes.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const tokenCookie = cookies.find(c => c.startsWith('token='));
        expect(tokenCookie).toBeDefined();

        // logout
        const res = await request(app).get('/api/auth/logout')
            .set('Cookie', tokenCookie)
            .expect(200);

        expect(res.body.message).toBe('logged out successfully');
        // expect cookie cleared in Set-Cookie header
        const newCookies = res.headers['set-cookie'];
        expect(newCookies).toBeDefined();
        expect(newCookies.some(c => c.startsWith('token=;') || c.includes('token=; Expires'))).toBe(true);
    });

    it('returns 401 when no token cookie provided', async () => {
        const res = await request(app).get('/api/auth/logout');
        expect(res.status).toBe(401);
    });
});
