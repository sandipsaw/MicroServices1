const request = require('supertest');
const app = require('../Src/app');

// Ensure the server doesn't start; we use app directly

describe('POST /api/auth/register', () => {
    it('creates a user and returns 201 with user (no password)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'san_deep_71219',
                email: 'sandip@example.com',
                password: '$@ndip$@W71219',
                fullname: { firstname: 'Sandip', lastname: 'saw' },
                role: 'user',
                addresses: {
                    street: 'tetul talab',
                    city: 'chirkunda',
                    state: 'jharkhand',
                    country: 'india',
                    pin_code: '828202',
                    phone: 8102466216,
                    isDefault: false,
                }
            });

        expect(res.status).toBe(201);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe('san_deep_71219');
        expect(res.body.user.email).toBe('sandip@example.com');
        expect(res.body.user.password).toBeUndefined();
    });

    it('rejects duplicate username/email with 400', async () => {
        const payload = {
            username: 'san_deep_71219',
            email: 'sandip@example.com',
            password: '$@ndip$@W71219',
            fullname: { firstname: 'Sandip', lastname: 'saw' },
            role: 'user',
            addresses: {
                street: 'tetul talab',
                city: 'chirkunda',
                state: 'jharkhand',
                country: 'india',
                pin_code: '828202',
                phone: 8102466216,
                isDefault: false,
            }
        };

        await request(app).post('/api/auth/register').send(payload).expect(201);
        const res = await request(app).post('/api/auth/register').send(payload);

        expect(res.status).toBe(400);
    });

    it('validates missing fields with 400', async () => {
        const res = await request(app).post('/api/auth/register').send({});
        expect(res.status).toBe(400);
    });
});