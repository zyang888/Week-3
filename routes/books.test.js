  
const request = require("supertest");

const server = require("../server");
const testUtils = require('../test-utils');
const Authors = require('../models/author');
const Books = require('../models/book');

const { testAuthors } = require('./authors.test');

describe("/books", () => {
  beforeAll(testUtils.connectDB);
  afterAll(testUtils.stopDB);

  let savedAuthors;
  const testBooks = [
    {
      title: "The Handmaid's Tale",
      genre: "Dystopian",
      ISBN: "123",
      blurb: "Scary potential future",
      publicationYear: 1985,
      pageCount: 311
    },
    {
      title: "Alias Grace",
      genre: "Historical Fiction",
      ISBN: "456",
      blurb: "Something about murder",
      publicationYear: 1996,
      pageCount: 470
    },
  ];

  beforeEach(async () => {
    savedAuthors = await Authors.insertMany(testAuthors);
    savedAuthors.forEach((author, index) => {
      author._id = savedAuthors[index]._id.toString();
    });

    testBooks[0].authorId = savedAuthors[0]._id.toString();
    testBooks[1].authorId = savedAuthors[0]._id.toString();

    const savedBooks = await Books.insertMany(testBooks);
    testBooks.forEach((book, index) => {
      book._id = savedBooks[index]._id.toString();
    });
  });
  afterEach(testUtils.clearDB);

  describe("GET /", () => {
    it("should return all books", async () => {
      const res = await request(server).get("/books");
      expect(res.statusCode).toEqual(200);
      testBooks.forEach(book => {
        expect(res.body).toContainEqual(
          expect.objectContaining(book)
        )
      })
    });
  });

  describe("GET /:id", () => {
    it("should return 404 if no matching id", async () => {
      const res = await request(server).get("/books/id1");
      expect(res.statusCode).toEqual(404);
    });

    it.each(testBooks)("should find book # %#", async (book) => {
      const res = await request(server).get("/books/" + book._id);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject(book);
    })
  });

  describe("POST /", () => {
    it("should reject a book with an empty body", async () => {
      const book = {};
      const res = await request(server).post("/books").send(book);
      expect(res.statusCode).toEqual(400);
    });

    const fullBook = {
      title: "New Book",
      genre: "Whatever",
      ISBN: "111",
      blurb: "Description",
      publicationYear: 1985,
      pageCount: 100
    };
    it.each(["title", "ISBN", "authorId", "publicationYear", "pageCount"])
      ("should reject a book without a %s", async (fieldToRemove) => {
      const book = { ...fullBook, authorId: savedAuthors._id };
      delete book[fieldToRemove];
      const res = await request(server).post("/books").send(book);
      expect(res.statusCode).toEqual(400);
    });

    it("should create a book", async () => {
      const book = { ...fullBook, authorId: savedAuthors[0]._id.toString() };
      const res = await request(server).post("/books").send(book);
      expect(res.statusCode).toEqual(200);
      const { _id } = res.body;
      const savedBook = await Books.findOne({ _id }).lean();
      savedBook._id = savedBook._id.toString();
      savedBook.authorId = savedBook.authorId.toString();
      expect(savedBook).toMatchObject(book);
    });
  });

  describe("PUT /:id", () => {
    it("should reject a book with an empty body", async () => {
      const { _id } = testBooks[0];
      const res = await request(server).put("/books/" + _id).send({});
      expect(res.statusCode).toEqual(400);
    });

    it("should reject a bad id", async () => {
      const res = await request(server).put("/books/fake").send(testBooks[0]);
      expect(res.statusCode).toEqual(400);
    });

    it("should update a book", async () => {
      const originalBook = testBooks[1];
      const book = { ...originalBook };
      book.blurb = "New Blurb";
      const res = await request(server).put("/books/" + book._id).send(book);
      expect(res.statusCode).toEqual(200);
     
      const savedBook = await Books.findOne({ _id: book._id }).lean();
      savedBook._id = savedBook._id.toString();
      expect(savedBook).toMatchObject(book);
    });
  });

  describe("DELETE /:id", () => {
    it("should reject a bad id", async () => {
      const res = await request(server).delete("/books/fake").send();
      expect(res.statusCode).toEqual(400);
    });
    
    it("should delete the expected book", async () => {
      const { _id } = testBooks[1];
      const res = await request(server).delete("/books/" + _id).send({});
      expect(res.statusCode).toEqual(200);
      const storedBook = await Books.findOne({ _id });
      expect(storedBook).toBeNull();
    });
  });
});