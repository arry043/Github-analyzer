/**
 * Centralized Error Handler Middleware
 *
 * Catches all errors propagated via next(error) and returns
 * a consistent JSON response with the appropriate status code.
 */

const errorHandler = (err, req, res, _next) => {
  // Determine status code: use the error's statusCode, or default to 500
  const statusCode = err.statusCode || 500;

  // Log server errors in non-test environments
  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${err.message}`);
    console.error(err.stack);
  }

  // MySQL-specific error handling
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).json({
      success: false,
      message: 'A database error occurred.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Axios / network errors (when GitHub API is unreachable)
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(502).json({
      success: false,
      message: 'Failed to connect to an external service.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
