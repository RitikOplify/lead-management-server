const { PrismaClient } = require("@prisma/client");
var jwt = require("jsonwebtoken");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const prisma = new PrismaClient();

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    return next(new ErrorHandler("Please Login To Access The Resources", 401));
  }
  const { user } = jwt.verify(accessToken, process.env.JWT_SECRET);
  req.user = user;
  next();
});

exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    return next(new ErrorHandler("Please Login To Access The Resources", 401));
  }
  const { user } = jwt.verify(accessToken, process.env.JWT_SECRET);

  if (user.role !== "admin") {
    return next(
      new ErrorHandler("Only the company owner can perform this action.", 403)
    );
  }
  req.user = user;
  next();
});
