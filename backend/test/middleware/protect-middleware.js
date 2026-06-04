import {expect} from 'chai';
import request from 'supertest';
import app from '../../app.js';

describe('Route Protection Functional Audit', () => {
    const protectedRoutes = [
        {path: '/api/auth/profile', method: 'get'},
        {path: '/api/auth/profile', method: 'put'},
        {path: '/api/auth/change-password', method: 'post'},

        {path: '/api/documents', method: 'get'},
        {path: '/api/documents/upload', method: 'post'},
        {path: '/api/documents/', method: 'delete'},
        {path: '/api/documents/1', method: 'get'},


        {path: '/api/flashcards/', method: 'get'},
        {path: '/api/flashcards/1', method: 'get'},
        {path: '/api/flashcards/1/review', method: 'post'},
        {path: '/api/flashcards/1/star', method: 'put'},
        {path: '/api/flashcards/1', method: 'delete'},

        {path: '/api/quizzes/1', method: 'get'},
        {path: '/api/quizzes/quiz/1', method: 'get'},
        {path: '/api/quizzes/1/results', method: 'get'},
        {path: '/api/quizzes/1/submit', method: 'post'},
        {path: '/api/quizzes/1', method: 'delete'},

        {path: '/api/ai/generate-flashcards', method: 'post'},
        {path: '/api/ai/generate-summary', method: 'post'},
        {path: '/api/ai/generate-quiz', method: 'post'},
        {path: '/api/ai/chat', method: 'post'},
        {path: '/api/ai/explain-concept', method: 'post'},
        {path: '/api/ai/chat-history/1', method: 'post'},

    ];
    protectedRoutes.forEach(({path, method}) => {
        it(`should return 401 Unauthorized for ${method.toUpperCase()} ${path} when no token is provided`, async () => {
            const response = await request(app)[method](path);

            expect(response.status).to.equal(401);
            expect(response.body).to.have.property('error');

            expect(response.body.error.toLowerCase()).to.contain('not authorized');
        });
    });

    describe('Auth Public Routes', () => {
        it('should allow access to login without a token', async () => {
            const response = await request(app).post('/api/auth/login');
            expect(response.status).to.not.equal(401);
        });

        it('should allow access to register without a token', async () => {
            const response = await request(app).post('/api/auth/register');
            expect(response.status).to.not.equal(401);
        });
    });
});
