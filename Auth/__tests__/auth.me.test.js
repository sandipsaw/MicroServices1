const request = require('supertest');
const app = require('../Src/app');

describe('GET /api/auth/me', () => {
    const userPayload = {
        username: 'san_deep_71219',
        email: 'sandip@example.com',
        password: '$@ndip$@W71219',
        fullname: { firstname: 'Sandip', lastname: 'saw' }
    }

    it('returns current user for valid token cookie', async () => {
        // Register user
        await request(app).post('/api/auth/register').send(userPayload).expect(201);

        // Login to get cookie
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ identifier: userPayload.username, password: userPayload.password });

        expect(loginRes.status).toBe(200);
        const cookies = loginRes.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const tokenCookie = cookies.find(c => c.startsWith('token='));
        expect(tokenCookie).toBeDefined();

        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', tokenCookie)
            .expect(200);

        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe(userPayload.username);
        expect(res.body.user.email).toBe(userPayload.email);
        expect(res.body.user.password).toBeUndefined();
    });

    it('returns 401 when no token cookie present', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});
