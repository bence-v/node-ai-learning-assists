import request from 'supertest';
import {expect} from 'chai';
import app from '../../app.js';

describe('Auth Middleware Integration', () => {
    it('should return 400 for the register route for not having a valid username, email, password', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({});

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
        expect(response.body.errors[0].msg).to.equal('Username must be at least 3 characters long!');
        expect(response.body.errors[1].msg).to.equal('Please provide a valid email address!');
        expect(response.body.errors[2].msg).to.equal('Password must be at least 6 characters long!');
    });

    it('should return 400 for the login route for not having a valid email and password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
        expect(response.body.errors[0].msg).to.equal('Please provide a valid email address!');
        expect(response.body.errors[1].msg).to.equal('Password is required!');
    });

    it('should return 400 for the login route for invalid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
        expect(response.body.errors[0].msg).to.equal('Please provide a valid email address!');
        expect(response.body.errors[1].msg).to.equal('Password is required!');
    });
});