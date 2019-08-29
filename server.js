'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Application Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
// Renders the search form
app.get('/', showHomepage);

app.get('/search', showSearch);

app.post('/books', submitBook);


app.post('/books/:id', showBook);

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

// Catch-all
app.get('*', send404);

app.listen(PORT, () => console.log(`Listening on port: ${PORT} , Baby`));

// HELPER FUNCTIONS
function Book(book) {
  this.title = book.title ? book.title : 'no title available';
  this.author = book.authors ? book.authors : 'no authors available';
  this.description = book.description ? book.description : 'no description available';
  this.image = book.imageLinks ? book.imageLinks.thumbnail.replace(/^http/, 'https') : null;
  this.isbn = book.industryIdentifiers ? book.industryIdentifiers[0].identifier : 'Apologies! We cant find the ISBN...';
}

function handleError(response, error, status = 500) {
  response.render('pages/error', { status: status, error: error.message });
}

function getErrorHandler(response, status = 500) {
  return (error) => handleError(response, error, status);
}

function showSearch(request, response) {
  response.render('pages/search');
}

function showHomepage(request, response) {
  client.query('SELECT * FROM books;').then(books => {
    response.render('pages/homepage', { books: books.rows });
  }).catch(getErrorHandler(response));
}

function submitBook(request, response) {
  try {
    const sql = 'INSERT INTO books (title, author, isbn, image, description, bookshelf) VALUES($1, $2, $3, $4, $5, $6) RETURNING id;';
    const values = [request.body.title, request.body.author, request.body.isbn, request.body.image, request.body.description, request.body.bookshelf];
    client.query(sql, values).then((sqlResponse) => {
      const sql = 'SELECT * FROM books WHERE id=$1';
      client.query(sql, [sqlResponse.rows[0].id]).then((sqlResponse) => {
        console.log(sqlResponse);
        response.render('pages/bookview', { book: sqlResponse.rows[0] });
      }).catch(getErrorHandler(response));
    }).catch(getErrorHandler(response));
  } catch (error) {
    handleError(response, error);
  }
}

function showBook(request, response) {
  request.body.id = request.params.id;
  response.render('pages/bookview', { book: request.body });
}

function send404(request, response) {
  response.status(404).send('Sorry! Something went wrong...');
}

// No API key required
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  console.log(request.body);
  console.log(request.body.search);

  if (request.body.search[1] === 'title') { url += `intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => {
      console.log(apiResponse.body.items[0].volumeInfo.industryIdentifiers)
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo));
    })
    .then(results => {
      // console.log(results);
      response.render('pages/show', { books: results })
    });


  // how will we handle errors?
}
