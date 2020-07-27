const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String },
  ISBN: { type: String, required: true },
  authorId: { type: String, required: true, index: true },
  blurb: { type: String },
  publicationYear: { type: Number, required: true },
  pageCount: { type: Number, required: true },
});

bookSchema.index({ title: "text", genre: "text", blurb: "text" });

module.exports = mongoose.model("books", bookSchema);
