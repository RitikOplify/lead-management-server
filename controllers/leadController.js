const { PrismaClient } = require("@prisma/client");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const { createLeadSchema } = require("../schema/adminValidation");
const prisma = new PrismaClient();

exports.createLead = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    email,
    contact,
    status,
    stage,
    source,
    city,
    state,
    price,
    comments,
    productId,
    executiveId,
    dealerId,
    followUp,
    companyName,
  } = req.body;

  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      contact,
      status,
      stage,
      source,
      city,
      companyName,
      state,
      price: parseInt(price),
      comments,
      companyId: req.user.companyId,
      productId,
      executiveId: executiveId
        ? executiveId
        : req.user.role === "executive"
        ? req.user.id
        : undefined,
      dealerId: dealerId
        ? dealerId
        : req.user.id === "dealer"
        ? req.user.id
        : undefined,
      followUps: {
        create: followUp
          ? {
              status: followUp.status,
              stage: followUp.stage,
              date: new Date(followUp.date),
              time: followUp.time,
              message: followUp.message,
            }
          : undefined,
      },
    },
    include: { followUps: true },
  });

  console.log(lead);

  res.status(201).json({ message: "Lead created", lead });
});

exports.getAllDetails = catchAsyncErrors(async (req, res, next) => {
  console.log(req.user.companyId);

  const company = await prisma.company.findUnique({
    where: { id: req.user.companyId },
    select: {
      name: true,
      email: true,
      id: true,
      executives: true,
      dealers: true,
      leads: true,
      products: true,
      categories: {
        select: {
          id: true,
          name: true,
          subcategories: true,
        },
      },
    },
  });

  res.status(200).json({ message: "Leads fetched", company });
});

exports.createFolloUp = catchAsyncErrors(async (req, res, next) => {
  const { leadId, status, stage, date, time, message } = req.body;

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage,
      status,
      followUps: {
        create: {
          status,
          stage,
          date: new Date(date),
          time,
          message,
        },
      },
    },
  });

  if (!lead) {
    return next(new ErrorHandler("Lead not found", 404));
  }

  res.status(200).json({ message: "Follow up created", lead });
});

exports.getLeadDetails = catchAsyncErrors(async (req, res, next) => {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: {
      followUps: true,
      product: {
        include: {
          category: true,
          subcategory: true,
        },
      },
      executive: true,
      dealer: true,
    },
  });
  if (!lead) {
    return next(new ErrorHandler("Lead not found", 404));
  }
  if (lead.companyId !== req.user.companyId) {
    return next(
      new ErrorHandler("You are not authorized to view this lead", 403)
    );
  }

  if (req.user.role === "dealer" && lead.dealerId !== req.user.id) {
    return next(
      new ErrorHandler("You are not authorized to view this lead", 403)
    );
  }

  res.status(200).json({ message: "Lead Fetched!", lead });
});
