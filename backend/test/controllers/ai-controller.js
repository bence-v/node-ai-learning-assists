import {expect} from 'chai';
import sinon from "sinon";
import Document from '../../models/Document.js';
import {generateFlashcards, generateQuiz, generateSummary, chat, explainConcept, getChatHistory} from '../../controllers/aiController.js';
import {geminiService} from "../../utils/geminiService.js";
import Flashcard from "../../models/Flashcard.js";
import Quiz from "../../models/Quiz.js";
import {textChunker} from "../../utils/textChunker.js";
import ChatHistory from "../../models/ChatHistory.js";

describe('AI Controller Module Tests', () =>  {
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
    describe('AI Controller - Generate Flashcards', function () {


        it('should return 400 if documentId is missing in the request body', async function () {

            req = {
                body: {
                    documentId: undefined,
                    count: 5
                }
            };

            await generateFlashcards(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Document ID is required',
                statusCode: 400
            });

        });

        it('should return 404 if document was not found or not ready', async function () {

            const findOneStub = sinon.stub(Document, 'findOne').returns(null);

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-id',
                    count: 5
                }
            };

            await generateFlashcards(req, res, next);

            expect(res.status.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Document not found or not ready.',
                statusCode: 404
            });

        });

        it('should generate flashcards successfully', async function () {

            const mockDocument = {
                extractedText: 'testText',
            };

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-id',
                    count: 5
                }
            };

            const mockedCards = {
                cards: [{
                    question: 'testQuestion',
                    answer: 'testAnswer',
                    difficulty: 'testDifficulty',
                }]
            };

            const flashCardSet = {
                userId: req.user._id,
                documentId: mockDocument._id,
                cards: mockedCards.cards.map(card => ({
                    question: card.question,
                    answer: card.answer,
                    difficulty: card.difficulty,
                    reviewCount: 0,
                    isStarred: false
                })),
            }

            const findOneStub = sinon.stub(Document, 'findOne').returns(mockDocument);
            const generateFlashcardsStub = sinon.stub(geminiService, 'generateFlashcards').returns(mockedCards.cards);
            const createFlashcardStub = sinon.stub(Flashcard, 'create').returns(mockedCards);

            await generateFlashcards(req, res, next);

            expect(res.status.calledWith(201)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: {
                    cards: mockedCards.cards.map(card => ({
                        question: card.question,
                        answer: card.answer,
                        difficulty: card.difficulty,
                    })),
                },
                message: "Flashcards generated successfully"
            });

        });

    });

    describe('AI Controller - Generate Quiz', function () {


        it('should return 400 if documentId is missing in the request body', async function () {

            req = {
                body: {
                    documentId: undefined,
                    numQuestions: 5,
                    title: "TestTitle"
                }
            };


            await generateQuiz(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Document ID is required',
                statusCode: 400
            });

        });

        it('should return 404 if document was not found or not ready', async function () {

            const findOneStub = sinon.stub(Document, 'findOne').returns(null);

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-id',
                    numQuestions: 5,
                    title: "TestTitle"
                }
            };

            await generateQuiz(req, res, next);

            expect(res.status.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Document was not found.',
                statusCode: 404
            });

        });

        it('should generate quiz successfully', async function () {

            const mockDocument = {
                extractedText: 'testText',
            };

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-doc-id',
                    numQuestions: 5,
                    title: "TestTitle"
                }
            };

            const mockedQuiz = {
                quiz: {
                    title: "TestTitle",
                    questions: [{
                        question: "Question 1",
                        options: ["A", "B", "C", "D"],
                        correctAnswer: "A"
                    }]
                }
            };

            const quizSet = {
                userId: req.user._id,
                documentId: mockDocument._id,
                title: mockedQuiz.quiz.title,
                questions: mockedQuiz.quiz.questions,
            };

            const findOneStub = sinon.stub(Document, 'findOne').returns(mockDocument);
            const generateQuizStub = sinon.stub(geminiService, 'generateQuiz').returns(mockedQuiz.quiz);
            const createQuizStub = sinon.stub(Quiz, 'create').returns(mockedQuiz);


            await generateQuiz(req, res, next);

            expect(res.status.calledWith(201)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: {quiz: mockedQuiz.quiz},
                message: "Quiz generated successfully"
            });

        });

    });

    describe('AI Controller - Generate Summary', function () {


        it('should return 400 if documentId is missing in the request body', async function () {

            req = {
                body: {
                    documentId: undefined,
                }
            };

            await generateSummary(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Document ID is required.',
                statusCode: 400
            });

        });

        it('should return 404 if document was not found or not ready', async function () {

            const findOneStub = sinon.stub(Document, 'findOne').returns(null);

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-id',
                }
            };

            await generateSummary(req, res, next);

            expect(res.status.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Document was not found or not ready.',
                statusCode: 404
            });

        });

        it('should generate summary successfully', async function () {

            const mockDocument = {
                _id: 'someUserId',
                extractedText: 'testText',
                title: 'Test Title'
            };

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-doc-id',
                }
            };
            const summary = "Test Summary.";

            const findOneStub = sinon.stub(Document, 'findOne').returns(mockDocument);

            const generateQuizStub = sinon.stub(geminiService, 'generateSummary').returns(summary);

            await generateSummary(req, res, next);

            expect(res.status.calledWith(201)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: {
                    documentId: mockDocument._id,
                    title: mockDocument.title,
                    summary
                },
                message: 'Summary generated successfully.'
            });

        });

    });

    describe('AI Controller - Chat', function () {


        it('should return 400 if documentId is missing in the request body', async function () {

            req = {
                body: {
                    documentId: undefined,
                    question: "What's my name?"
                }
            };


            await chat(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Please provide documentId and question.",
                statusCode: 400
            });

        });

        it('should return 404 if document was not found or not ready', async function () {

            const findOneStub = sinon.stub(Document, 'findOne').returns(null);

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-id',
                    question: "What's my name?"
                }
            };

            await chat(req, res, next);

            expect(res.status.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Document was not found or not ready.',
                statusCode: 404
            });

        });

        it('should generate answer in chat successfully without chat history', async function () {

            const mockDocument = {
                _id: 'someUserId',
                extractedText: 'testText',
                title: 'Test Title',
                chunks: [{
                    content: "Content",
                    pageNumber: 7,
                    chunkIndex: 1,
                }],
            };

            const mockRelevantChunks = [{
                content: "Test Content",
                chunkIndex: 1,
                pageNumber: 2,
                _id: 1,
                score: 5,
                rawScore: 7,
                matchedWords: 3
            }, {
                content: "Test 2 Content",
                chunkIndex: 2,
                pageNumber: 3,
                _id: 2,
                score: 6,
                rawScore: 2,
                matchedWords: 1
            }];

            const chunkIndexes = mockRelevantChunks.map(c => c.chunkIndex);

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-doc-id',
                    question: "What's my name?"
                }
            };

            const emptyChatHistory = {
                _id: "ChatHistoryId",
                userId: req.user._id,
                documentId: mockDocument._id,
                messages: [],
                save: sinon.stub().resolves()
            };

            const summary = "Test Summary.";

            const findOneStub = sinon.stub(Document, 'findOne').returns(mockDocument);
            const findRelevantChunksStub = sinon.stub(textChunker, 'findRelevantChunks').returns(mockRelevantChunks);

            const generateQuizStub = sinon.stub(geminiService, 'chatWithContext').returns(summary);
            const chatHistoryStub = sinon.stub(ChatHistory, 'findOne').returns(null);

            const createChatHistoryStub = sinon.stub(ChatHistory, 'create').returns(emptyChatHistory);

            await chat(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: {
                    documentId: mockDocument._id,
                    title: mockDocument.title,
                    answer: summary,
                    relevantChunks: chunkIndexes,
                    chatHistory: emptyChatHistory._id
                },
                message: 'Response generated successfully'
            });

        });

    });

    describe('AI Controller - Explain Concept', function () {


        it('should return 400 if documentId is missing in the request body', async function () {

            req = {
                body: {
                    documentId: undefined,
                    concept: "The concept"
                }
            };

            await explainConcept(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Please provide documentId and concept.",
                statusCode: 400
            });

        });

        it('should return 404 if document was not found or not ready', async function () {

            const findOneStub = sinon.stub(Document, 'findOne').returns(null);

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-id',
                    concept: "The concept"
                }
            };

            await explainConcept(req, res, next);

            expect(res.status.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: 'Document was not found or not ready.',
                statusCode: 404
            });

        });

        it('should generate an explanation for a concept', async function () {

            const mockDocument = {
                _id: 'someUserId',
                extractedText: 'testText',
                title: 'Test Title',
                chunks: [{
                    content: "Content",
                    pageNumber: 7,
                    chunkIndex: 1,
                }],
            };

            const mockRelevantChunks = [{
                content: "Test Content",
                chunkIndex: 1,
                pageNumber: 2,
                _id: 1,
                score: 5,
                rawScore: 7,
                matchedWords: 3
            }, {
                content: "Test 2 Content",
                chunkIndex: 2,
                pageNumber: 3,
                _id: 2,
                score: 6,
                rawScore: 2,
                matchedWords: 1
            }];

            const context = mockRelevantChunks.map(c => c.content).join('\n\n');

            req = {
                user: {
                    _id: 'someUserId',
                },
                body: {
                    documentId: 'test-doc-id',
                    concept: "The concept"
                }
            };

            const explanation = "The explanation of the concept";
            const relevantChunks = mockRelevantChunks.map(c => c.chunkIndex);

            const findOneStub = sinon.stub(Document, 'findOne').returns(mockDocument);
            const findRelevantChunksStub = sinon.stub(textChunker, 'findRelevantChunks').returns(mockRelevantChunks);

            const explanationStub = sinon.stub(geminiService, 'explainConcept').returns(explanation);

            await explainConcept(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: {
                    concept: req.body.concept,
                    explanation,
                    relevantChunks: relevantChunks
                },
                message: 'Explanation generated successfully'
            });

        });

    });

    describe('AI Controller - Get Chat History', function () {


        it('should return 400 if documentId is missing in the request body', async function () {

            req = {
                params: {
                    documentId: undefined,
                }
            };

            await getChatHistory(req, res, next);

            expect(res.status.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Please provide documentId.",
                statusCode: 400
            });

        });

        it('should return success with empty chat history bc there is no chat history for this document', async function () {

            req = {
                user: {
                    _id: 'someUserId',
                },
                params: {
                    documentId: 'test-id',
                }
            };

            const findOneStub = sinon.stub(ChatHistory, 'findOne').returns({
                select: sinon.stub().returns(null)
            });

            await getChatHistory(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: [],
                message: 'No chat history found for this document.',
                statusCode: 200
            });

        });

        it('should retrieve chat history successfully', async function () {

            req = {
                user: {
                    _id: 'someUserId',
                },
                params: {
                    documentId: 'test-id',
                }
            };


            const emptyChatHistory = {
                _id: "ChatHistoryId",
                userId: req.user._id,
                documentId: "test-doc.id",
                messages: [],
                save: sinon.stub().resolves()
            };

            const findOneStub = sinon.stub(ChatHistory, 'findOne').returns({
                select: sinon.stub().returns(Promise.resolve(emptyChatHistory))
            });

            await getChatHistory(req, res, next);

            expect(res.status.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: emptyChatHistory.messages,
                message: "Chat history retrieved successfully.",
                statusCode: 200
            });

        });

    });
});
