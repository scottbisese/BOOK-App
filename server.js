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
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
// Renders the search form
app.get('/', (req, res) => {
  client.query('SELECT * FROM books;').then(books => {
    res.render('pages/homepage', {books: books.rows});
  });
});

app.get('/search', (req, res) => { 
  // Note that .ejs file extension is not required
  res.render('pages/search');
});


app.get('/books/:id', (req, res) => {
  console.log(req.params.id);
});

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

// Catch-all
app.get('*', (request, response) => response.status(404).send('Sorry! Something went wrong...'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT} , Baby`));

// HELPER FUNCTIONS
function Book(book) {
  this.title = book.title ? book.title: 'no title available';
  this.author = book.authors ? book.authors: 'no authors available';
  this.description = book.description ? book.description: 'no description available';
  this.image = book.imageLinks ? book.imageLinks.thumbnail.replace(/^http/, 'https') : null;
  this.isbn = book.industryIdentifiers ? book.industryIdentifiers[0].identifier : 'Apologies! We cant find the ISBN...';
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
      response.render('pages/show', {books: results})
    });
 

  // how will we handle errors?
}
