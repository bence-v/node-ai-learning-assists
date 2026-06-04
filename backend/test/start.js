import { expect } from 'chai';
import errorHandler from '../middleware/errorHandler.js';
import sinon from "sinon";

describe('Testing middleware errorHandler', function() {
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

    it('should return with 404 Resource not found', async  function() {

        const err = {
            name: 'CastError'
        }

        errorHandler(err, req, res, next);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({
            error: 'Resource not found',
            success: false,
            statusCode: 404,
            ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
        })).to.be.true;
    });

});
