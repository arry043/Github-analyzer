/**
 * 404 Not Found Middleware
 *
 * Catches requests to undefined routes and returns
 * a consistent 404 JSON response.
 */

const notFound = (req, res, _next) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export default notFound;
