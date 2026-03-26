const Joi = require('joi');

const createPost = {
  body: Joi.object({
    image: Joi.string().optional(),
    images: Joi.array().items(Joi.string()).min(1).optional(),
    caption: Joi.string().allow('').optional(),
    location: Joi.string().allow('').optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
};

const updatePost = {
  body: Joi.object({
    caption: Joi.string().allow('').optional(),
    location: Joi.string().allow('').optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
};

const addComment = {
  body: Joi.object({
    text: Joi.string().min(1).required(),
    tags: Joi.array().items(Joi.string()).optional(),
    parentId: Joi.string().hex().length(24).allow(null).optional(),
  }),
};

module.exports = { createPost, updatePost, addComment };
