import {expect} from 'chai';
import sinon from "sinon";
import Flashcard from '../../models/Flashcard.js';
import {
    getFlashcards,
    getAllFlashcardSets,
    reviewFlashcard,
    toggleStarFlashcard,
    deleteFlashcardSet
} from '../../controllers/flashcardController.js';

describe('Flashcard Controller Module Tests', () => {
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

    describe('Flashcard Controller - Get Flashcards', () => {
        it('should return a flashcards array if found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    documentId: 'test-doc-id'
                }
            };

            const mockFlashcards = {
                userId: req.user._id,
                documentId: req.params.documentId,
                cards: [
                    {
                        question: "What is my name?",
                        answer: "My name is Bob.",
                        difficulty: "medium",
                        lastReviewed: "2020-01-01",
                        reviewCount: 1,
                        isStarred: false,
                    },
                ]
            };

            const sortStub = sinon.stub().resolves(mockFlashcards);

            const populateStub = sinon.stub().returns({sort: sortStub});

            const findStub = sinon.stub(Flashcard, 'find').returns({populate: populateStub});

            await getFlashcards(req, res, next);

            expect(statusStub.calledWith(200)).to.be.true;
            expect(findStub.calledWith({
                userId: req.user._id,
                documentId: req.params.documentId
            })).to.be.true;

            expect(populateStub.calledWith('documentId', 'title fileName')).to.be.true;
            expect(sortStub.calledWith({createdAt: -1})).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                count: mockFlashcards.length,
                data: mockFlashcards
            });
            expect(next.notCalled).to.be.true;
        });
    });

    describe('Flashcard Controller - Get AllFlashcardSets', () => {
        it('should return a flashcard sets if found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    documentId: 'test-doc-id'
                }
            };

            const mockFlashcardSets = [
                {
                    _id: '6a1b0242ce15d3b93d916dd1',
                    userId: req.user._id,
                    documentId: req.params.documentId,
                    cards: [
                        {
                            question: "What is my name?",
                            answer: "My name is Bob.",
                            difficulty: "medium",
                            lastReviewed: "2020-01-01",
                            reviewCount: 1,
                            isStarred: false,
                        },
                    ]
                }];

            const sortStub = sinon.stub().resolves(mockFlashcardSets);

            const populateStub = sinon.stub().returns({sort: sortStub});

            const findStub = sinon.stub(Flashcard, 'find').returns({populate: populateStub});

            await getAllFlashcardSets(req, res, next);

            expect(statusStub.calledWith(200)).to.be.true;
            expect(findStub.calledWith({
                userId: req.user._id,
            })).to.be.true;

            expect(populateStub.calledWith('documentId', 'title')).to.be.true;
            expect(sortStub.calledWith({createdAt: -1})).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                count: mockFlashcardSets.length,
                data: mockFlashcardSets
            });
            expect(next.notCalled).to.be.true;
        });
    });

    describe('Flashcard Controller - Review Flashcard', () => {
        it('should return card not found in flashcard set', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    cardId: 'test-flashcard-id'
                },
            };

            const mockFlashcard = {
                _id: 'test-flashcardset-1',
                userId: req.user._id,
                documentId: 'test-doc-id',
                cards: [
                    {
                        _id: 'test-flashcard-id1',
                        question: "What is my name?",
                        answer: "My name is Bob.",
                        difficulty: "medium",
                        lastReviewed: "2020-01-01",
                        reviewCount: 1,
                        isStarred: false,
                    },
                ],
            };

            const mockedFlashcard = sinon.stub(Flashcard, 'findOne').resolves(mockFlashcard);

            await reviewFlashcard(req, res, next);

            expect(mockedFlashcard.calledWith({
                'cards._id': req.params.cardId,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Card not found in flashcard set.',
                statusCode: 404
            });
            expect(next.notCalled).to.be.true;
        });

        it('should update the review count and lastReviewed date', async () => {
                req = {
                    user: { _id: '6a1b0242ce15d3b93d916dd1' },
                    params: { cardId: 'test-flashcard-id' },
                };

                let mockFlashcard = {
                    _id: 'test-flashcardset-1',
                    userId: req.user._id,
                    documentId: 'test-doc-id',
                    cards: [
                        {
                            _id: 'test-flashcard-id',
                            question: "What is my name?",
                            answer: "My name is Bob.",
                            difficulty: "medium",
                            lastReviewed: "2020-01-01",
                            reviewCount: 1,
                            isStarred: false,
                        },
                    ],
                    save: sinon.stub().resolves()
                };

                const findOneStub = sinon.stub(Flashcard, 'findOne').resolves(mockFlashcard);

                await reviewFlashcard(req, res, next);

                expect(findOneStub.calledWith({
                    'cards._id': req.params.cardId,
                    userId: req.user._id
                })).to.be.true;

                expect(statusStub.calledWith(200)).to.be.true;
                expect(res.json.calledOnce).to.be.true;

                const responseBody = res.json.firstCall.args[0];

                expect(responseBody.data.cards[0].reviewCount).to.equal(2);

                expect(new Date(responseBody.data.cards[0].lastReviewed)).to.be.a('date');
                expect(responseBody.data.cards[0].lastReviewed).to.not.equal("2020-01-01");

                expect(mockFlashcard.save.calledOnce).to.be.true;
                expect(next.notCalled).to.be.true;
            });
    });

    describe('Flashcard Controller - Toggle StarFlashcard', () => {
        it('should return flashcard set not found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    cardId: 'test-flashcard-id'
                },
            };

            const mockedFlashcard = sinon.stub(Flashcard, 'findOne').resolves(null);

            await toggleStarFlashcard(req, res, next);

            expect(mockedFlashcard.calledWith({
                'cards._id': req.params.cardId,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Flashcard set or card not found.',
                statusCode: 404
            });
            expect(next.notCalled).to.be.true;
        });

        it('should return card not found in flashcard set', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    cardId: 'test-flashcard-id'
                },
            };

            const mockFlashcard = {
                _id: 'test-flashcardset-1',
                userId: req.user._id,
                documentId: 'test-doc-id',
                cards: [
                    {
                        _id: 'test-flashcard-id1',
                        question: "What is my name?",
                        answer: "My name is Bob.",
                        difficulty: "medium",
                        lastReviewed: "2020-01-01",
                        reviewCount: 1,
                        isStarred: false,
                    },
                ],
            };

            const mockedFlashcard = sinon.stub(Flashcard, 'findOne').resolves(mockFlashcard);

            await toggleStarFlashcard(req, res, next);

            expect(mockedFlashcard.calledWith({
                'cards._id': req.params.cardId,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Card not found in set.",
                statusCode: 404
            });
            expect(next.notCalled).to.be.true;
        });

        it('should toggle the isStarred status of a flashcard', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    cardId: 'test-flashcard-id'
                },
            };

            let mockFlashcard = {
                _id: 'test-flashcardset-1',
                userId: req.user._id,
                documentId: 'test-doc-id',
                cards: [
                    {
                        _id: 'test-flashcard-id',
                        question: "What is my name?",
                        answer: "My name is Bob.",
                        difficulty: "medium",
                        lastReviewed: "2020-01-01",
                        reviewCount: 1,
                        isStarred: false,
                    },
                ],
                save: sinon.stub().resolves()
            };

            const mockedFlashcard = sinon.stub(Flashcard, 'findOne').resolves(mockFlashcard);

            await toggleStarFlashcard(req, res, next);

            expect(mockedFlashcard.calledWith({
                'cards._id': req.params.cardId,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];
            expect(mockFlashcard.cards[0].isStarred).to.be.true;

            expect(responseBody).to.deep.equal({
                success: true,
                data: mockFlashcard,
                message: `Flashcard ${mockFlashcard.cards[0].isStarred ? 'favorite' : 'unfavorited'} successfully`,
            });
            expect(next.notCalled).to.be.true;
        });
    });

    describe('Flashcard Controller - Delete FlashcardSet', () => {
        it('should return 404 because card set was not found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-flashcard-id'
                },
            };

            const mockFlashcard = {

            };

            const mockedFlashcard = sinon.stub(Flashcard, 'findOne').resolves(null);

            await deleteFlashcardSet(req, res, next);

            expect(mockedFlashcard.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Flashcard set not found.',
                statusCode: 404
            });
            expect(next.notCalled).to.be.true;
        });

        it('should delete the flashcard set if found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-flashcard-id'
                },
            };

            const mockFlashcardSet = {
                _id: 'test-flashcard-id',
                userId: req.user._id,
                documentId: 'test-doc-id',
                cards: [],
                deleteOne: sinon.stub().resolves()
            };

            const mockedFlashcard = sinon.stub(Flashcard, 'findOne').resolves(mockFlashcardSet);

            await deleteFlashcardSet(req, res, next);

            expect(mockedFlashcard.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                message: "Flashcard set deleted successfully!"
            });
            expect(next.notCalled).to.be.true;
        });
    });

});
