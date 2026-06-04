import {expect} from 'chai';
import sinon, {mock} from "sinon";
import Document from '../../models/Document.js';
import Flashcard from '../../models/Flashcard.js';
import Quiz from '../../models/Quiz.js';
import { getDocument, deleteDocument, getDocuments, uploadDocument } from '../../controllers/documentController.js';
import mongoose from "mongoose";
import fs from "fs/promises";
import {PDFHelpers} from "../../utils/pdfParser.js";

describe('Document Controller Module Tests', () => {
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

    describe('Document Controller - Get Documents', () => {
        it('should return a document if found', async () => {
            const mockDocuments = [{ title: 'New Doc', content: 'Some content', userId: '6a1b0242ce15d3b93d916dd1' }];
            const mockedDocument = sinon.stub(Document, 'aggregate').returns(mockDocuments);

            req = { user: { _id: '6a1b0242ce15d3b93d916dd1' } };

            await getDocuments(req, res, next);

            expect(statusStub.calledWith(200)).to.be.true;
            expect(mockedDocument.calledWith([
                {
                    $match: {userId: new mongoose.Types.ObjectId(req.user._id)}
                },
                {
                    $lookup: {
                        from: 'flashcards',
                        localField: '_id',
                        foreignField: 'documentId',
                        as: 'flashcardSets'
                    },
                },
                {
                    $lookup: {
                        from: 'quizzes',
                        localField: '_id',
                        foreignField: 'documentId',
                        as: 'quizzes'
                    },
                },
                {
                    $addFields: {
                        flashcardCount: { $size: '$flashcardSets'},
                        quizCount: { $size: '$quizzes'},
                    }
                },
                {
                    $project: {
                        extractedText: 0,
                        chunks: 0,
                        flashcardSets: 0,
                        quizzes: 0,
                    }
                },
                {
                    $sort: { uploadDate: -1}
                }
            ])).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                count: mockDocuments.length,
                data: mockDocuments
            });
            expect(next.notCalled).to.be.true;
        });
    });

    describe('Document Controller - Get Document', () => {
        it('should return 404 document was not found', async () => {
            const mockedDocument = sinon.stub(Document, 'findOne').returns(null);

            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-doc-id'
                }
            };

            await getDocument(req, res, next);

            expect(statusStub.calledWith(404)).to.be.true;
            expect(mockedDocument.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Document not found.",
                statusCode: 404,
            });
            expect(next.notCalled).to.be.true;
        });

        it('should return a document if found', async () => {
            const mockDocument = {
                _id: 'test-doc-id',
                title: 'New Doc',
                content: 'Some content',
                userId: '6a1b0242ce15d3b93d916dd1',
                save: sinon.stub().resolves(),
                toObject: sinon.stub().returnsThis()
            };
            const mockedDocument = sinon.stub(Document, 'findOne').returns(mockDocument);
            const mockedFlashcard = sinon.stub(Flashcard, 'countDocuments').returns(10);
            const mockedQuiz = sinon.stub(Quiz, 'countDocuments').returns(10);

            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-doc-id'
                }
            };

            await getDocument(req, res, next);

            expect(statusStub.calledWith(200)).to.be.true;
            expect(mockedDocument.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];


            expect(responseBody.data.flashcardCount).to.equal(10);
            expect(responseBody.data.quizCount).to.equal(10);
            expect(mockedFlashcard.calledWith({documentId: mockDocument._id, userId: req.user._id})).to.be.true;
            expect(mockedQuiz.calledWith({documentId: mockDocument._id, userId: req.user._id})).to.be.true;
            expect(responseBody).to.deep.equal({
                success: true,
                data: mockDocument
            });
            expect(next.notCalled).to.be.true;
        });
    });

    describe('Document Controller - Delete Document', () => {
        it('should return 404 document was not found', async () => {
            const mockedDocument = sinon.stub(Document, 'findOne').returns(null);

            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-doc-id'
                }
            };

            await deleteDocument(req, res, next);

            expect(statusStub.calledWith(404)).to.be.true;
            expect(mockedDocument.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Document not found.",
                statusCode: 404,
            });
            expect(next.notCalled).to.be.true;
        });

        it('should delete a document if found', async () => {
            const mockDocument = {
                title: 'New Doc',
                content: 'Some content',
                userId: '6a1b0242ce15d3b93d916dd1',
                filePath: 'test-file-path',
                deleteOne: sinon.stub().resolves(),
            };
            const mockedDocument = sinon.stub(Document, 'findOne').returns(mockDocument);
            const mockedFs = sinon.stub(fs, 'unlink').returns(Promise.resolve());

            req = {
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                },
                params: {
                    id: 'test-doc-id'
                }
            };

            await deleteDocument(req, res, next);

            expect(statusStub.calledWith(200)).to.be.true;
            expect(mockedDocument.calledWith({
                _id: req.params.id,
                userId: req.user._id
            })).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];
            expect(mockedFs.calledWith(mockedDocument.filePath)).to.be.true;


            expect(responseBody).to.deep.equal({
                success: true,
                message: "Document deleted successfully."
            });
            expect(next.notCalled).to.be.true;
        });
    });

    describe('Document Controller - Upload Document', () => {
        it('should return 400 because PDF was not attached', async () => {
            req = {
                file: undefined
            };

            await uploadDocument(req, res, next);

            expect(statusStub.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Please upload a PDF file!",
                statusCode: 400
            });
            expect(next.notCalled).to.be.true;
        });

        it('should return 400 because Title was not given for the document', async () => {
            req = {
                file: 'test-file',
                body: {
                    title: undefined
                }
            };

            const mockedFs = sinon.stub(fs, 'unlink').returns(Promise.resolve());

            await uploadDocument(req, res, next);

            expect(statusStub.calledWith(400)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: false,
                error: "Please provide a document title.",
                statusCode: 400,
            });
            expect(next.notCalled).to.be.true;
        });

        it('should upload the document successfully', async () => {
            req = {
                file: {
                    path: "test-path",
                    originalname: "originalName",
                    size: 1024
                },
                body: {
                    title: 'Test Document title'
                },
                user: {
                    _id: '6a1b0242ce15d3b93d916dd1'
                }
            };

            const baseUrl = `http://localhost:${process.env.PORT || 8000}`;

            const mockedDocument = {
                _id: 'test-doc-id',
                userId: req.user._id,
                title: req.body.title,
                fileName: req.file.originalname,
                filePath: `${baseUrl}/uploads/documents/${req.file.filename}`,
                fileSize: req.file.size,
                status: 'processing'
            }

            const mockedFs = sinon.stub(fs, 'unlink').returns(Promise.resolve());
            const mockedPDFHelpers = sinon.stub(PDFHelpers, 'processPDF').returns(Promise.resolve());
            const mockedDocumentCreate = sinon.stub(Document, 'create').returns(mockedDocument);

            await uploadDocument(req, res, next);

            expect(statusStub.calledWith(201)).to.be.true;

            expect(res.json.calledOnce).to.be.true;
            const responseBody = res.json.firstCall.args[0];

            expect(responseBody).to.deep.equal({
                success: true,
                data: mockedDocument,
                message: "Document uploaded successfully. Processing in progress..."
            });
            expect(next.notCalled).to.be.true;
        });
    });
});
