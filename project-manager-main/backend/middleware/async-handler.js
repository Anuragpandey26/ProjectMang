/**
 * Middleware to wrap asynchronous route handlers and catch any errors,
 * passing them to the next error-handling middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
