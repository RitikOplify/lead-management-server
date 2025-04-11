const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const { generateTokens } = require("../utils/generateToken");
const {
  createCategorySchema,
  createSubcategorySchema,
  createProductSchema,
  companyRegisterSchema,
  createSalesExecutiveSchema,
  loginSchema,
} = require("../schema/adminValidation");
const {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} = require("../utils/cookieOptions");
const prisma = new PrismaClient();

exports.registerCompany = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  const parsed = companyRegisterSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    return next(new ErrorHandler(parsed.error.errors[0].message, 400));
  }
  const existingCompany = await prisma.company.findUnique({
    where: { email },
  });
  if (existingCompany) {
    return next(
      new ErrorHandler("Company with this email already exists", 400)
    );
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const company = await prisma.company.create({
    data: { name, email, password: hashedPassword },
  });
  const { accessToken, refreshToken } = generateTokens({
    name: company.name,
    id: company.id,
    role: company.role,
    companyId: company.id,
  });
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  res.status(201).json({ message: "Company registered successfully", company });
});

exports.login = catchAsyncErrors(async (req, res, next) => {
  const validationResult = loginSchema.safeParse(req.body);
  if (!validationResult.success) {
    return next(
      new ErrorHandler(validationResult.error.errors[0].message, 400)
    );
  }
  const { email, password } = validationResult.data;
  const company = await prisma.company.findUnique({ where: { email } });
  if (!company) {
    return next(
      new ErrorHandler("Incorrect email or password. Please try again.", 401)
    );
  }
  const isMatch = await bcrypt.compare(password, company.password);
  if (!isMatch) {
    return next(
      new ErrorHandler("Incorrect email or password. Please try again.", 401)
    );
  }
  const { accessToken, refreshToken } = generateTokens({
    name: company.name,
    id: company.id,
    role: company.role,
    companyId: company.id,
  });
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);

  res.status(200).json({
    success: true,
    message: "Login successful! Welcome back.",
    company: {
      id: company.id,
      name: company.name,
      email: company.email,
    },
    accessToken,
    refreshToken,
  });
});

exports.refreshToken = catchAsyncErrors(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new ErrorHandler("Session expired. Please log in again.", 401));
  }

  const { id } = jwt.verify(refreshToken, process.env.JWT_SECRET);
  if (!id) {
    return next(
      new ErrorHandler("Invalid refresh token. Please log in again.", 403)
    );
  }

  const validUser = await prisma.company.findUnique({
    where: { id },
  });

  if (!validUser) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return next(new ErrorHandler("User not found. Please log in again.", 404));
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    name: validUser.name,
    id: validUser.id,
    role: validUser.role,
    companyId: validUser.id,
  });

  console.log("New Refresh Token:", newRefreshToken);

  res.status(200).json({
    success: true,
    accessToken,
    refreshToken: newRefreshToken,
    message: "Session refreshed successfully.",
  });
});

exports.currentAdmin = catchAsyncErrors(async (req, res, next) => {
  const user = await prisma.company.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return next(new ErrorHandler("User not found. Please log in.", 404));
  }

  res.status(200).json({ success: true, user });
});

exports.approveDealer = catchAsyncErrors(async (req, res, next) => {
  const { dealerId } = req.params;
  const dealer = await prisma.dealer.update({
    where: { id: dealerId },
    data: { status: "ACTIVE" },
  });
  if (!dealer) {
    return next(new ErrorHandler("Dealer not found", 404));
  }
  res.status(200).json({ message: "Dealer approved successfully", dealer });
});

exports.createSalesExecutive = catchAsyncErrors(async (req, res, next) => {
  const { username, email, password } = req.body;
  companyId = req.user.id;

  const parsed = createSalesExecutiveSchema.safeParse({
    username,
    email,
    password,
    companyId,
  });

  if (!parsed.success) {
    return next(new ErrorHandler(parsed.error.errors[0].message, 400));
  }

  const existingExecutive = await prisma.executive.findUnique({
    where: { email },
  });
  if (existingExecutive) {
    return next(
      new ErrorHandler("Executive with this email already exists", 400)
    );
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const executive = await prisma.executive.create({
    data: { username, email, password: hashedPassword, companyId },
  });

  res
    .status(201)
    .json({ message: "Sales Executive created successfully", executive });
});

exports.viewAllLeads = catchAsyncErrors(async (req, res, next) => {
  const leads = await prisma.lead.findMany();
  res.status(200).json({ leads });
});

exports.viewAllDealers = catchAsyncErrors(async (req, res, next) => {
  const dealers = await prisma.dealer.findMany({
    where: { companyId: req.user.companyId },
  });
  res.status(200).json({ dealers });
});

exports.viewAllSalesExecutives = catchAsyncErrors(async (req, res, next) => {
  const executives = await prisma.executive.findMany({
    where: { companyId: req.user.companyId },
  });
  res.status(200).json({ executives });
});

exports.createCategory = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;
  companyId = req.user.companyId;

  const parsed = createCategorySchema.safeParse({ name });
  if (!parsed.success) {
    return next(new ErrorHandler(parsed.error.errors[0].message, 400));
  }

  const category = await prisma.category.create({
    data: { name, companyId },
  });

  res.status(201).json({ message: "Category created successfully", category });
});

exports.createSubcategory = catchAsyncErrors(async (req, res, next) => {
  const { name, categoryId } = req.body;
  const parsed = createSubcategorySchema.safeParse({ name, categoryId });
  if (!parsed.success) {
    return next(new ErrorHandler(parsed.error.errors[0].message, 400));
  }

  const categoryExists = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!categoryExists) {
    return next(new ErrorHandler("Category does not exist", 404));
  }

  const subcategory = await prisma.subcategory.create({
    data: { name, categoryId },
  });

  res
    .status(201)
    .json({ message: "Subcategory created successfully", subcategory });
});

exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, categoryId, subcategoryId } = req.body;
  const companyId = req.user.companyId;
  const parsed = createProductSchema.safeParse({
    name,
    companyId,
    categoryId,
    subcategoryId,
  });
  if (!parsed.success) {
    return next(new ErrorHandler(parsed.error.errors[0].message, 400));
  }

  if (categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { subcategories: true },
    });

    if (!categoryExists) {
      return next(new ErrorHandler("Category does not exist", 404));
    }

    if (subcategoryId) {
      const subcategoryExists =
        categoryExists.subcategories.includes(subcategoryId);
      if (!subcategoryExists) {
        return next(new ErrorHandler("Subcategory does not exist", 404));
      }
    }
  }

  const product = await prisma.product.create({
    data: { name, companyId, categoryId, subcategoryId },
  });

  res.status(201).json({ message: "Product created successfully", product });
});

exports.getAllCategories = catchAsyncErrors(async (req, res, next) => {
  const categories = await prisma.category.findMany({
    include: { subcategories: true, products: true },
  });
  res.status(200).json({ categories });
});

exports.getSubcategoriesByCategory = catchAsyncErrors(
  async (req, res, next) => {
    const { categoryId } = req.params;

    const subcategories = await prisma.subcategory.findMany({
      where: { categoryId },
    });

    res.status(200).json({ subcategories });
  }
);

exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await prisma.product.findMany({
    include: { category: true, subcategory: true, company: true },
  });
  res.status(200).json({ products });
});
