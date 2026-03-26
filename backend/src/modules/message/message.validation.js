const Joi = require('joi');

const sendMessage = {
  body: Joi.object({
    message: Joi.string().allow('').optional(),
    type: Joi.string().valid('text', 'post', 'image', 'gif', 'video').optional(),
    mediaUrl: Joi.string().uri().optional(),
    postId: Joi.string().optional(),
  }).or('message', 'mediaUrl', 'postId'), // at least one must be present
};

module.exports = { sendMessage };
