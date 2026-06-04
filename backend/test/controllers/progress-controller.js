import {expect} from 'chai';
import sinon from "sinon";
import Document from '../../models/Document.js';
import Quiz from '../../models/Quiz.js';
import Flashcard from "../../models/Flashcard.js";
import {
    getDashboard
} from '../../controllers/progressController.js';

describe('Progress Controller Module Tests', () => {
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

    it('should return 200 and dashboard data for a valid request', async () => {
        req = {
            user: { _id: 'user123' }
        };

        const totalDocumentsStub = sinon.stub(Document, 'countDocuments').returns(10);
        const totalFlashcardSetsStub = sinon.stub(Flashcard, 'countDocuments').returns(10);

        const quizCountStub = sinon.stub(Quiz, 'countDocuments');
        quizCountStub.withArgs({ userId: req.user._id }).resolves(20);
        quizCountStub.withArgs({ userId: req.user._id, completedAt: { $ne: null } }).resolves(8);

        const mockFlashcardSets = [
            {
                cards: [
                    { reviewCount: 1, isStarred: true },
                    { reviewCount: 0, isStarred: false }
                ]
            }
        ];
        sinon.stub(Flashcard, 'find').resolves(mockFlashcardSets);

        const mockQuizzes = [
            { score: 80 },
            { score: 90 }
        ];
        const quizFindStub = sinon.stub(Quiz, 'find');
        quizFindStub.withArgs({ userId: req.user._id, completedAt: { $ne: null } }).resolves(mockQuizzes);

        const mockRecentDocs = [{ title: 'Doc 1' }];
        const docFindStub = sinon.stub(Document, 'find').returns({
            sort: sinon.stub().returns({
                limit: sinon.stub().returns({
                    select: sinon.stub().resolves(mockRecentDocs)
                })
            })
        });

        const mockRecentQuizzes = [{ title: 'Quiz 1' }];
        quizFindStub.withArgs({ userId: req.user._id }).returns({
            sort: sinon.stub().returns({
                limit: sinon.stub().returns({
                    populate: sinon.stub().returns({
                        select: sinon.stub().resolves(mockRecentQuizzes)
                    })
                })
            })
        });

        await getDashboard(req, res, next);

        expect(statusStub.calledWith(200)).to.be.true;
        const responseData = jsonStub.firstCall.args[0].data;
        expect(responseData.overview.totalDocuments).to.equal(10);
        expect(responseData.overview.averageScore).to.equal(85);
        expect(responseData.recentActivity.documents).to.deep.equal(mockRecentDocs);
        expect(responseData.overview.totalFlashcards).to.equal(2);
        expect(responseData.overview.totalQuizzes).to.equal(20);
        expect(responseData.recentActivity.quizzes).to.deep.equal(mockRecentQuizzes);
        expect(responseData.overview.totalFlashcardSets).to.equal(10);

        expect(next.notCalled).to.be.true;

    });
})