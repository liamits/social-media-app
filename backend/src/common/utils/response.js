/**
 * Send a standardized API response: { success, data, message, meta? }
 */
const sendResponse = (res, statusCode, data, message = '', meta = undefined) => {
  const body = { success: true, data, message };
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
};

module.exports = { sendResponse };
