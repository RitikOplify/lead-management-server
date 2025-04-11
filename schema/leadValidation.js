// /zod/lead.schema.js
const { z } = require("zod");

const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  contact: z.string().min(10, "Contact must be at least 10 digits"),
  status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]),
  stage: z.enum(["INQUIRY", "NEGOTIATION", "FINALIZED"]),
  source: z.string().min(1, "Source is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  price: z.number().nonnegative("Price must be a positive number"),
  comments: z.string().optional(),
  productId: z.string().uuid().optional(),
  executiveId: z.string().uuid().optional(),
  dealerId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
});

module.exports = { createLeadSchema };
