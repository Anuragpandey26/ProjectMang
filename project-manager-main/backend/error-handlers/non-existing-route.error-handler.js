import { AppError } from "./global.error-handler.js";

const handleNonExistingRoute = (req, res, next) => {
  const error = new AppError(
    `Cannot find ${req.originalUrl} on this server`,
    404
  );
  next(error);
};

export { handleNonExistingRoute };
