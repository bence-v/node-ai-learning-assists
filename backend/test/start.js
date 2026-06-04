import { expect } from 'chai';
import errorHandler from '../middleware/errorHandler.js';
import sinon from "sinon";

describe('Testing middleware errorHandler', function() {
    it('should return with 404 Resource not found', async  function() {
        let res;

        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
        };

        const err = {
            name: 'CastError'
        }

        errorHandler(err, {},res,()=>{});

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({
            error: 'Resource not found',
            success: false,
            statusCode: 404,
            ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
        })).to.be.true;
    });
});
