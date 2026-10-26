const { z } = require('zod');

// A valid URL that starts with http:// or https:// (blocks javascript:, data:, ftp: and similar)
const httpUrl = z
  .string()
  .url()
  .max(500)
  .refine((u) => /^https?:\/\//i.test(u), 'Link must start with http:// or https://');

module.exports = { httpUrl };