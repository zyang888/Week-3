const mongoose = require("mongoose");

const Book = require("../models/book");
const Author = require("../models/author");

module.exports = {};

module.exports.getAll = async (page, perPage) => {
  return await Book.find()
    .limit(perPage)
    .skip(perPage * page)
    .lean();
};

module.exports.getAllByAuthor = async (authorId) => {
  return await Book.aggregate([{ $match: { authorId: authorId } }]);
};

module.exports.search = async (term) => {
  return await Book.find(
    { $text: { $search: term } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .lean();
};

module.exports.getById = (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return null;
  }
  return Book.findOne({ _id: bookId }).lean();
};

module.exports.deleteById = async (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.deleteOne({ _id: bookId });
  return true;
};

module.exports.updateById = async (bookId, newObj) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.updateOne({ _id: bookId }, newObj);
  return true;
};

module.exports.create = async (bookData) => {
  try {
    const created = await Book.create(bookData);
    return created;
  } catch (e) {
    if (e.message.includes("validation failed") || e.message.includes("duplicate key")) {
      throw new BadDataError(e.message);
    }
    throw e;
  }
};

module.exports.getAuthorStats = async () => {
  const authorStats = await Book.aggregate([
    {
      $group: {
        _id: "$authorId",
        averagePageCount: { $avg: "$pageCount" },
        numBooks: { $sum: 1 },
        titles: { $addToSet: "$title" },
      },
    },
    {
      $project: {
        _id: 0,
        authorId: { $toObjectId: "$_id" },
        averagePageCount: 1,
        numBooks: 1,
        titles: { $reverseArray: "$titles" },
      },
    },
  ]);
  return authorStats;
};

module.exports.authorInfo = async () => {
  const authorStats = await Book.aggregate([
    {
      $group: {
        _id: "$authorId",
        averagePageCount: { $avg: "$pageCount" },
        numBooks: { $sum: 1 },
        titles: { $addToSet: "$title" },
      },
    },
    {
      $project: {
        _id: 0,
        authorId: { $toObjectId: "$_id" },
        averagePageCount: 1,
        numBooks: 1,
        titles: { $reverseArray: "$titles" },
      },
    },
    {
      $lookup: {
        from: "authors",
        localField: "authorId",
        foreignField: "_id",
        as: "author",
      },
    },
    { $unwind: "$author" },
  ]);
  return authorStats;
};

class BadDataError extends Error {}
module.exports.BadDataError = BadDataError;
