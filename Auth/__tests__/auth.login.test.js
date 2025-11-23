const request = require('supertest');
const app = require('../Src/app');

describe('POST /api/auth/login', () => {
    const userPayload = {
        username: 'san_deep_71219',
        email: 'sandip@example.com',
        password: '$@ndip$@W71219',
        fullname: { firstname: 'Sandip', lastname: 'saw' }
    }

    it('logs in a registered user with username and returns 200 and sets token cookie', async () => {
        // register first
        await request(app).post('/api/auth/register').send(userPayload).expect(201);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: userPayload.username, password: userPayload.password });

        expect(res.status).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe(userPayload.username);
        expect(res.body.user.email).toBe(userPayload.email);
        // password should not be returned
        expect(res.body.user.password).toBeUndefined();
        // cookie token should be set
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies.some(c => c.startsWith('token='))).toBe(true);
    });

    it('rejects invalid password with 401', async () => {
        // register a user
        await request(app).post('/api/auth/register').send({
            username: 'san_deep_71219',
            email: 'sandip@example.com',
            password: '$@ndip$@W71219',
            fullname: { firstname: 'Sandip', lastname: 'saw' }
        }).expect(201);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'san_deep_71219', password: 'taba5+' });

        expect(res.status).toBe(401);
    });

    it('validates missing fields and returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.status).toBe(400);
    });
});
