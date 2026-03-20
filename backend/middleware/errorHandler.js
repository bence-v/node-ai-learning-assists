
const errorHandler = (err,req,res,next) => {
    let statusCode = err.statisCode || 500;
    let message = err.message || 'Server error';

    //Mongoose bad ObjectId
    if(!err.name === 'CastError') {
        message = 'Resource not found';
        statusCode = 404;
    }

    // Mongoose duplicate key
    if(err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
        statusCode = 400;
    }

    //Mongoose validation error
    if(err.name === 'ValidationError') {
        message = Object.values(err.errors).map(val => val.message).join(', ');
        statusCode = 404;
    }

    // Multer filter error
    if(err.code === 'LIMIT_FILE_SIZE') {
        message = "File size exceeds the mxiumum limit of 10MB";
        statusCode = 400;
    }

    // JWT Errors
    if(err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        statusCode = 401;
    }

    if(err.name === 'TokenExpiredError') {
        message = 'Token expired';
        statusCode = 401;
    }

    console.log('Error: ', {
        message: err.message,
        stack: process.env.NODE_ENV == 'develompment' ? err.stack : undefined
    });

    res.status(statusCode).json({
        success:false,
        error: message,
        statusCode,
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
    });
};
export default errorHandler;