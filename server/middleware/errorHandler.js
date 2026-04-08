


const errorHandler = (err,req,res,next) => {
    let statusCode = err.statusCode || 500;
<<<<<<< HEAD
    let message = err.message | 'Interval server error';
=======
    let message = err.message || 'Internal server error';
>>>>>>> 4030e73 (hekko)

     //Mongoose validation error
    if(err.name === 'ValidationError'){
        statusCode = 400;
        message = Object.values(err.errors).map(error => error.message).join(', ')
    }

    //mongoose duplicate key error
    if(err.code === 11000){
        statusCode= 400;
        message = 'Duplicate field value entered'
    }

    //JWT
    if(err.name === 'JsonWebTokenError'){
        statusCode = 401;
        message = 'Invalid Token'
    }

        if(err.name === 'TokenExpiredError'){
        statusCode = 401;
        message = 'Token expired'
    }


    console.error('Error',err);

    res.status(statusCode).json({
        success:false,
        error:message,
    })
}



<<<<<<< HEAD
export default errorHandler;
=======
export default errorHandler;
>>>>>>> 4030e73 (hekko)
