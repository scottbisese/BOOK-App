'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3001;

// Application Middleware
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
// Renders the search form
app.get('/', (req, res) => { 
  // Note that .ejs file extension is not required
  res.render('pages/index');
});

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

// Catch-all
app.get('*', (request, response) => response.status(404).send('You can go fuck yourself, buddy!'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT} , Baby`));

// HELPER FUNCTIONS
function Book(book) {
  this.title = book.title;
  this.author = book.authors || book.author;
  this.description = book.description;
  this.image = book.imageLinks.thumbnail || book.imageLinks.smallThumbnail;
  if (location.protocol != 'https:') {
    location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
  }
}

// No API key required
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  console.log(request.body);
  console.log(request.body.search);

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => {
      console.log(apiResponse.body.items[0]);
      apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
    })
    .then(results => response.render('pages/searches/show', {searchResults: results}));
  // how will we handle errors?
}
