import { expect } from 'chai';
import sinon, {mock} from "sinon";
import User from '../../models/User.js';
import {register, login, getProfile, updateProfile, changePassword} from '../../controllers/authController.js';
import jwt from "jsonwebtoken";

describe('Auth Controller - Module Tests', function() {

    let statusStub, jsonStub, req, res, next;

    beforeEach(() => {
        statusStub = sinon.stub();
        jsonStub = sinon.spy();
        res = {
            status: statusStub,
            json: jsonStub
        };
        statusStub.returns(res);
        next = sinon.stub();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Auth Controller - Login', () => {

        it('Should return with the user and token on successful login', async function() {
            const mockUser = {
                _id: 'someUserId',
                username: "test",
                email: "test@gmail.com",
                profileImage: "testImage",
                matchPassword: sinon.stub().resolves(true)
            };

            const findOneStub = sinon.stub(User, 'findOne').returns({
                select: sinon.stub().returns(Promise.resolve(mockUser))
            });

            const signStub = sinon.stub(jwt, 'sign').returns('test_token');

            req = {
                body: {
                    email: 'test@gmail.com',
                    password: 'password123'
                }
            };

            await login(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                user: {
                    id: 'someUserId',
                    username: "test",
                    email: "test@gmail.com",
                    profileImage: "testImage",
                },
                token: "test_token",
                message: "Login successful!"
            });


            expect(mockUser.matchPassword.calledWith('password123')).to.be.true;
        });

        it('Should return with an error, that we gave invalid credentials, password incorrect', async function() {

            const mockUser = {
                _id: 'someUserId',
                username: "test",
                email: "test@gmail.com",
                profileImage: "testImage",
                matchPassword: sinon.stub().resolves(false)
            };

            const findOneStub = sinon.stub(User, 'findOne').returns({
                select: sinon.stub().returns(Promise.resolve(mockUser))
            });

            const signStub = sinon.stub(jwt, 'sign').returns('test_token');

            req = {
                body: {
                    email: 'test@gmail.com',
                    password: 'password1234'
                }
            };

            await login(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Invalid credentials!",
                statusCode:401,
            });

            expect(mockUser.matchPassword.calledWith('password1234')).to.be.true;
        });

        it('Should return with an error, that we gave invalid credentials, user does not exists', async function() {

            const findOneStub = sinon.stub(User, 'findOne').returns({
                select: sinon.stub().returns(Promise.resolve(null))
            });

            req = {
                body: {
                    email: 'test@gmail.com',
                    password: 'password1234'
                }
            };

            await login(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Invalid credentials!",
                statusCode:401,
            });
        });
    });

    describe('Auth Controller - Register', () => {

        it('Should return with the user and token on successful register', async function() {
            const mockUser = {
                _id: 'someUserId',
                username: "test",
                email: "test@gmail.com",
                profileImage: "profileImage",
                createdAt: "2020-01-01",
            };
            const findOneStub = sinon.stub(User, 'findOne').returns(null);

            const createOneStub = sinon.stub(User, 'create').returns(mockUser);

            const signStub = sinon.stub(jwt, 'sign').returns('test_token');

            req = {
                body: {
                    email: 'test@gmail.com',
                    username: 'TestUser',
                    password: 'password123'
                }
            };

            await register(req, res, next);

            expect(createOneStub.calledWith(req.body)).to.be.true;

            expect(res.status.calledWith(201)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: {
                    user: {
                        id: 'someUserId',
                        username: "test",
                        email: "test@gmail.com",
                        profileImage: "profileImage",
                        createdAt: "2020-01-01",
                    },
                    token: "test_token",
                },
                message: "User registered success!",
            });

        });

        it('Should return with an error that the email address already taken', async function() {

            const mockUser = {
                _id: 'someUserId',
                username: "test",
                email: "test@gmail.com",
                profileImage: "profileImage",
                createdAt: "2020-01-01",
            };

            req = {
                body: {
                    email: 'test@gmail.com',
                    username: 'TestUser',
                    password: 'password123'
                }
            };

            const findOneStub = sinon.stub(User, 'findOne').returns(mockUser);


            await register(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Email already registered.",
                statusCode: 400,
            });
        });

        it('Should return with an error that the username already taken', async function() {

            const mockUser = {
                _id: 'someUserId',
                username: "test",
                email: "test@gmail.com",
                profileImage: "profileImage",
                createdAt: "2020-01-01",
            };

            req = {
                body: {
                    email: 'test1@gmail.com',
                    username: 'TestUser',
                    password: 'password123'
                }
            };

            const findOneStub = sinon.stub(User, 'findOne').returns(mockUser);

            await register(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Username already taken.",
                statusCode: 400,
            });
        });

    });

    describe('Auth Controller - Get Profile', function() {
        it('Should return with the user\'s data', async function() {
            const mockUser = {
                _id: 'someUserId',
                username: "test",
                email: "test@gmail.com",
                profileImage: "testImage",
                createdAt: '2020-01-01',
                updatedAt: '2020-01-01',
            };

            const findOneStub = sinon.stub(User, 'findById').returns(mockUser);

            req = {
                user: {
                    _id: 'someUserId'
                }
            };

            await getProfile(req, res, next);

            expect(findOneStub.calledWith(mockUser._id)).to.be.true;

            expect(res.status.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: {
                    id: 'someUserId',
                    username: "test",
                    email: "test@gmail.com",
                    profileImage: "testImage",
                    createdAt: '2020-01-01',
                    updatedAt: '2020-01-01',
                },
            });
        });
    });

    describe('Auth Controller - Update Profile', async function() {
        it('Should return with the updated user\'s data', async function() {
            const mockUser = {
                _id: 'someUserId',
                username: "test",
                email: "test@gmail.com",
                profileImage: "testImage",
                createdAt: '2020-01-01',
                updatedAt: '2020-01-01',
            };

            const findOneStub = sinon.stub(User, 'findByIdAndUpdate').returns(mockUser);

            req = {
                user: {
                    _id: 'someUserId'
                },
                body: {
                    profileImage: "testImage",
                    username: "test",
                    email: "test@gmail.com",
                }
            };

            await updateProfile(req, res, next);

            expect(findOneStub.calledWith(mockUser._id,
                { username: mockUser.username, email: mockUser.email, profileImage: mockUser.profileImage },
                { new: true, runValidators: true })).to.be.true;

            expect(res.status.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: {
                    id: mockUser._id,
                    username: mockUser.username,
                    email: mockUser.email,
                    profileImage: mockUser.profileImage,
                },
                message: "Profile updated successfully!",
            });
        })
    });

    describe('Auth Controller - Change Password', async function() {

        it('Should return with error because current password is not set', async function() {
            req = {
                body: {
                    currentPassword: undefined,
                    newPassword: "test",
                }
            };

            await changePassword(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Please provide current and new password",
                statusCode: 400,
            });
        })

        it('Should return with error because current new password is not set', async function() {

            req = {
                body: {
                    currentPassword: "test",
                    newPassword: undefined,
                }
            };

            await changePassword(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Please provide current and new password",
                statusCode: 400,
            });
        })

        it('Should return with error because current password is incorrect', async function() {
            const mockUser = {
                _id: 'someUserId',
                username: "test",
                email: "test@gmail.com",
                profileImage: "testImage",
                matchPassword: sinon.stub().resolves(false)
            };

            const findOneStub = sinon.stub(User, 'findById').returns({
                select: sinon.stub().returns(Promise.resolve(mockUser))
            });

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    currentPassword: 'password123',
                    newPassword: 'test123456'
                }
            };

            await changePassword(req, res, next);

            expect(res.status.calledWith(401)).to.be.true;

            expect(findOneStub.calledWith(req.user._id)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Current password is incorrect",
                statusCode: 401,
            });

            expect(mockUser.matchPassword.calledWith('password123')).to.be.true;
        })

        it('Should return success, that the password changed', async function() {
            const mockUser = {
                _id: 'someUserId',
                username: "test",
                email: "test@gmail.com",
                profileImage: "testImage",
                matchPassword: sinon.stub().resolves(true),
                save: sinon.stub().resolves()
            };

            const findOneStub = sinon.stub(User, 'findById').returns({
                select: sinon.stub().returns(Promise.resolve(mockUser))
            });

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    currentPassword: 'password123',
                    newPassword: 'test123456'
                }
            };

            await changePassword(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;

            expect(findOneStub.calledWith(req.user._id)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                message: "Password changed successfully"
            });

            expect(mockUser).to.have.property('password','test123456');

            expect(mockUser.matchPassword.calledWith('password123')).to.be.true;
        })
    });
});