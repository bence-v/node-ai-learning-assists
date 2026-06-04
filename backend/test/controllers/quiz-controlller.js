import {expect} from 'chai';
import sinon from "sinon";
import Quiz from '../../models/Quiz.js';
import {
    getQuizzes,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
} from '../../controllers/quizController.js';
import _ from 'lodash'

describe('Quiz Controller Module Tests', () => {
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

    describe('Quiz Controller - Get Quizzes', () => {
        it('should return quizzes if were found any', async () => {
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

            const findStub = sinon.stub(Quiz, 'find').returns({populate: populateStub});

            await getQuizzes(req, res, next);

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

    describe('Quiz Controller - Get QuizById', () => {
        it('should return 404 because quiz set was not found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    documentId: 'test-doc-id'
                }
            };

            const findStub = sinon.stub(Quiz, 'findOne').returns(null);

            await getQuizById(req, res, next);

            expect(statusStub.calledWith(404)).to.be.true;
            expect(findStub.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Quiz was not found.",
                statusCode: 404
            });
            expect(next.notCalled).to.be.true;
        });

        it('should return 200 and the quiz if found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    documentId: 'test-doc-id'
                }
            };

            const mockQuiz = {
                _id: "65f1a2b3c4d5e6f7a8b9c0d1",
                userId: req.user._id,
                documentId: "65f1a2b3c4d5e6f7a8b9c0d2",
                title: "Node.js Fundamentals Quiz",
                questions: [
                    {
                        question: "What is Node.js?",
                        options: [
                            "A browser-based framework",
                            "A JavaScript runtime built on Chrome's V8 engine",
                            "A database management system",
                            "A programming language"
                        ],
                        correctAnswer: "A JavaScript runtime built on Chrome's V8 engine",
                        explanation: "Node.js is an open-source, cross-platform, JavaScript runtime environment that executes JavaScript code outside a web browser."
                    },
                    {
                        question: "Which module is used to create a web server in Node.js?",
                        options: ["fs", "path", "http", "url"],
                        correctAnswer: "http",
                        explanation: "The http module allows Node.js to transfer data over the Hyper Text Transfer Protocol (HTTP)."
                    }
                ],
                totalQuestions: 2,
                score: 0,
                status: "draft",
                createdAt: new Date()
            };
            const expectedQuiz = _.cloneDeep(mockQuiz);

            const findStub = sinon.stub(Quiz, 'findOne').returns(mockQuiz);

            await getQuizById(req, res, next);

            expect(statusStub.calledWith(200)).to.be.true;
            expect(findStub.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: expectedQuiz
            });
            expect(next.notCalled).to.be.true;
        });
    });

    describe('Quiz Controller - Submit Quiz', () => {
        it('should return an error because answer paramter was not an array', async () => {
            req = {
                body: {
                    answers: "test"
                },
            };

            await submitQuiz(req, res, next);

            expect(statusStub.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Please provide answers as an array.",
                statusCode: 400
            });
            expect(next.notCalled).to.be.true;
        });

        it('should return 404 because quiz was not found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-quiz-id'
                },
                body: {
                    answers: [
                        {index: 1, answer: "test"},
                    ]
                },
            };

            const findOneStub = sinon.stub(Quiz, 'findOne').resolves(null);

            await submitQuiz(req, res, next);

            expect(findOneStub.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(404)).to.be.true;
            expect(res.json.calledOnce).to.be.true;

            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Quiz not found.",
                statusCode: 404
            })

            expect(next.notCalled).to.be.true;
        });

        it('should return 400 because quiz was already completed', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-quiz-id'
                },
                body: {
                    answers: [
                        {questionIndex: 1, selectedAnswer: "test"},
                    ]
                },
            };

            const mockQuiz = {
                completedAt: '2020-01-01'
            };

            const findOneStub = sinon.stub(Quiz, 'findOne').resolves(mockQuiz);

            await submitQuiz(req, res, next);

            expect(findOneStub.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(400)).to.be.true;
            expect(res.json.calledOnce).to.be.true;

            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Quiz already completed.",
                statusCode: 400
            })

            expect(next.notCalled).to.be.true;
        });

        it('should return 200 because quiz was completed', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-quiz-id'
                },
                body: {
                    answers: [
                        {questionIndex: 0, selectedAnswer: "A JavaScript runtime built on Chrome's V8 engine"},
                        {questionIndex: 1, selectedAnswer: "http"},
                    ]
                },
            };

            const mockQuiz = {
                _id: "65f1a2b3c4d5e6f7a8b9c0d1",
                userId: req.user._id,
                documentId: "65f1a2b3c4d5e6f7a8b9c0d2",
                title: "Node.js Fundamentals Quiz",
                questions: [
                    {
                        question: "What is Node.js?",
                        options: [
                            "A browser-based framework",
                            "A JavaScript runtime built on Chrome's V8 engine",
                            "A database management system",
                            "A programming language"
                        ],
                        correctAnswer: "A JavaScript runtime built on Chrome's V8 engine",
                        explanation: "Node.js is an open-source, cross-platform, JavaScript runtime environment that executes JavaScript code outside a web browser."
                    },
                    {
                        question: "Which module is used to create a web server in Node.js?",
                        options: ["fs", "path", "http", "url"],
                        correctAnswer: "http",
                        explanation: "The http module allows Node.js to transfer data over the Hyper Text Transfer Protocol (HTTP)."
                    }
                ],
                totalQuestions: 2,
                score: 0,
                status: "draft",
                createdAt: new Date(),
                save: sinon.stub().resolves()
            };
            const expectedQuizResult = _.cloneDeep(mockQuiz);

            const findOneStub = sinon.stub(Quiz, 'findOne').resolves(mockQuiz);

            await submitQuiz(req, res, next);

            expect(findOneStub.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            const userAnswers = [];
            req.body.answers.forEach(answer => {
                const {questionIndex, selectedAnswer} = answer;

                if(questionIndex < expectedQuizResult.questions.length) {
                    const question = expectedQuizResult.questions[questionIndex];
                    const isCorrect = question.correctAnswer === selectedAnswer;

                    userAnswers.push({
                        questionIndex,
                        selectedAnswer,
                        isCorrect,
                    });
                }
            });

            expectedQuizResult.userAnswers = userAnswers;

            expect(statusStub.calledWith(200)).to.be.true;
            expect(res.json.calledOnce).to.be.true;

            expect(new Date(mockQuiz.completedAt)).to.be.a('date');
            expect(mockQuiz.score).to.be.a('number');
            expect(mockQuiz.userAnswers).to.be.a('array');

            const correctAnswers = 2;
            const score = Math.round((correctAnswers / expectedQuizResult.totalQuestions) * 100);

            const responseBody = res.json.firstCall.args[0];

            responseBody.data.userAnswers.forEach((userAnswer) => {
                expect(userAnswer.answeredAt).to.be.a('number');
            });

            responseBody.data.userAnswers = responseBody.data.userAnswers.map(({ answeredAt, ...rest }) => rest);

            expect(responseBody).to.deep.equal({
                success: true,
                data: {
                    quizId: expectedQuizResult._id,
                    score,
                    correctCount: correctAnswers,
                    totalQuestions: expectedQuizResult.totalQuestions,
                    percentage: score,
                    userAnswers: expectedQuizResult.userAnswers
                },
                message: "Quiz completed successfully"
            })

            expect(next.notCalled).to.be.true;
        });
    });

    describe('Quiz Controller - Get Quiz Results', () => {
        it('should return 404 because quiz result was not found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-flashcard-id'
                },
            };

            const mockedQuiz = sinon.stub(Quiz, 'findOne').returns({
                populate: sinon.stub().resolves(null)
            });

            await getQuizResults(req, res, next);

            expect(mockedQuiz.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Quiz not found.",
                statusCode: 404
            });
            expect(next.notCalled).to.be.true;
        });

        it('should return 400 because quiz result was not completed', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-flashcard-id'
                },
            };

            const mockQuiz = {completedAt: false};

            const mockedQuiz = sinon.stub(Quiz, 'findOne').returns({
                populate: sinon.stub().resolves(mockQuiz)
            });

            await getQuizResults(req, res, next);

            expect(mockedQuiz.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Quiz not completed.",
                statusCode: 400
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

            const mockQuiz = {
                _id: "65f1a2b3c4d5e6f7a8b9c0d1",
                userId: req.user._id,
                documentId: "65f1a2b3c4d5e6f7a8b9c0d2",
                title: "Node.js Fundamentals Quiz",
                questions: [
                    {
                        question: "What is Node.js?",
                        options: [
                            "A browser-based framework",
                            "A JavaScript runtime built on Chrome's V8 engine",
                            "A database management system",
                            "A programming language"
                        ],
                        correctAnswer: "A JavaScript runtime built on Chrome's V8 engine",
                        explanation: "Node.js is an open-source, cross-platform, JavaScript runtime environment that executes JavaScript code outside a web browser."
                    },
                    {
                        question: "Which module is used to create a web server in Node.js?",
                        options: ["fs", "path", "http", "url"],
                        correctAnswer: "http",
                        explanation: "The http module allows Node.js to transfer data over the Hyper Text Transfer Protocol (HTTP)."
                    }
                ],
                totalQuestions: 2,
                score: 0,
                status: "draft",
                createdAt: new Date(),
                save: sinon.stub().resolves(),
                completedAt: "2020-01-01",
                userAnswers: [
                    {questionIndex: 0, selectedAnswer: "A JavaScript runtime built on Chrome's V8 engine", isCorrect: true},
                    {questionIndex: 1, selectedAnswer: "http", isCorrect: true}
                ],
            };
            const expectedResultQuiz = _.cloneDeep(mockQuiz);

            const mockedQuiz = sinon.stub(Quiz, 'findOne').returns({
                populate: sinon.stub().resolves(mockQuiz)
            });

            await getQuizResults(req, res, next);

            const detailedResults = expectedResultQuiz.questions.map((question, index) => {
                const userAnswer = expectedResultQuiz.userAnswers.find(a => a.questionIndex === index);
                return {
                    questionIndex: index,
                    question: question.question,
                    options: question.options,
                    correctAnswer: question.correctAnswer,
                    selectedAnswer: userAnswer?.selectedAnswer || null,
                    isCorrect: userAnswer?.isCorrect || false,
                    explanation: question.explanation
                };
            });

            expect(mockedQuiz.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(200)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: {
                    quiz: {
                        id: expectedResultQuiz._id,
                        title: expectedResultQuiz.title,
                        document: expectedResultQuiz.documentId,
                        score: expectedResultQuiz.score,
                        totalQuestions: expectedResultQuiz.totalQuestions,
                        completedAt: expectedResultQuiz.completedAt
                    },
                    results: detailedResults
                }
            });
            expect(next.notCalled).to.be.true;
        });
    });

    describe('Quiz Controller - Delete Quiz', () => {
        it('should return 404 because quiz which we want to delete was not found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-flashcard-id'
                },
            };

            const mockedQuiz = sinon.stub(Quiz, 'findOne').resolves(null);

            await deleteQuiz(req, res, next);

            expect(mockedQuiz.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(404)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Quiz not found.",
                statusCode: 404
            });
            expect(next.notCalled).to.be.true;
        });

        it('should return 404 because quiz which we want to delete was not found', async () => {
            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-quiz-id'
                },
            };

            const mockQuiz = {
                deleteOne: sinon.stub().resolves()
            };

            const findOneStub = sinon.stub(Quiz, 'findOne').resolves(mockQuiz);

            await deleteQuiz(req, res, next);

            expect(findOneStub.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(statusStub.calledWith(200)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(mockQuiz.deleteOne.calledOnce).to.be.true;

            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                message: "Quiz deleted successfully!"
            })

            expect(next.notCalled).to.be.true;
        });
    });

});
