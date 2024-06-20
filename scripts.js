document.getElementById('search-button').addEventListener('click', searchMovies);
document.getElementById('favorites-button').addEventListener('click',displayFavorites);

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let reviews = JSON.parse(localStorage.getItem('reviews')) || {};

function searchMovies() {
    const query = document.getElementById('search-input').value;
    if (query) {
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=d9cf93b96321e53a7172e2e0a574d66d&query=${query}`)
            .then(response => response.json())
            .then(data => {
                displayMovies(data.results);
            })
            .catch(error => console.error('Error:', error));
    }
}

function displayMovies(movies) {
    const movieList = document.getElementById('movie-list');
    movieList.innerHTML = '';
    if (movies && movies.length > 0) {
        movies.forEach(movie => {
            const movieItem = document.createElement('div');
            movieItem.className = 'movie-item';
            const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/150';
            const isFavorite = favorites.some(fav => fav.id === movie.id);
            movieItem.innerHTML = `
                <img src="${posterPath}" alt="${movie.title}" data-movie-id="${movie.id}">
                <h3 data-movie-id="${movie.id}">${movie.title}</h3>
                <p>${movie.release_date}</p>
                <button class="movie-details-button" data-movie-id="${movie.id}">Movie Details</button>
            `;
            movieItem.querySelector('img').addEventListener('click', showMovie);
            movieItem.querySelector('h3').addEventListener('click', showMovie);
            movieItem.querySelector('.movie-details-button').addEventListener('click', function() {
                viewDetails(movie.id);
            });
            movieList.appendChild(movieItem);
        });
    } else {
        movieList.innerHTML = '<p>No movies found.</p>';
    }
}

function showMovie(event) {
    const movieId = event.target.getAttribute('data-movie-id');
    if (movieId) {
        fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=d9cf93b96321e53a7172e2e0a574d66d`)
            .then(response => response.json())
            .then(movieDetails => {
                const vidsrcUrl = `https://multiembed.mov/?video_id=${movieDetails.imdb_id}`;
                const modal = document.getElementById('video-modal');
                const videoPlayer = document.getElementById('video-player');
                videoPlayer.src = vidsrcUrl;
                modal.style.display = 'block';

                // Set download link
                const downloadButton = document.getElementById('download-button');
                downloadButton.onclick = () => downloadMovie(movieDetails.imdb_id);

                // Set favorite button
                const favoriteButton = document.getElementById('favorite-button');
                favoriteButton.onclick = () => addToFavorites(movieDetails);

                // Add event listener for fullscreen button
                const fullscreenButton = document.getElementById('fullscreen-button');
                fullscreenButton.addEventListener('click', function() {
                    if (videoPlayer.requestFullscreen) {
                        videoPlayer.requestFullscreen();
                    } else if (videoPlayer.mozRequestFullScreen) { /* Firefox */
                        videoPlayer.mozRequestFullScreen();
                    } else if (videoPlayer.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                        videoPlayer.webkitRequestFullscreen();
                    } else if (videoPlayer.msRequestFullscreen) { /* IE/Edge */
                        videoPlayer.msRequestFullscreen();
                    }
                });
            })
            .catch(error => console.error('Error fetching movie details:', error));
    }
}
function downloadMovie(imdbId) {
    const downloadUrl = "assets/czoon.html";
    window.open(downloadUrl, '_blank');
}

function addToFavorites(movie) {
    if (!favorites.some(fav => fav.id === movie.id)) {
        favorites.push(movie);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert('Added to favorites!');
    }
}

function removeFromFavorites(movieId) {
    favorites = favorites.filter(fav => fav.id !== movieId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
    alert('Removed from favorites!');
}

function displayFavorites() {
    const favoritesList = document.getElementById('movie-list');
    favoritesList.innerHTML = '';
    if (favorites.length > 0) {
        favorites.forEach(movie => {
            fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=d9cf93b96321e53a7172e2e0a574d66d`)
                .then(response => response.json())
                .then(movieDetails => {
                    const movieItem = document.createElement('div');
                    movieItem.className = 'movie-item';
                    const posterPath = movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : 'https://via.placeholder.com/150';
                    movieItem.innerHTML = `
                        <img src="${posterPath}" alt="${movieDetails.title}" data-movie-id="${movieDetails.id}">
                        <h3 data-movie-id="${movieDetails.id}">${movieDetails.title}</h3>
                        <p>${movieDetails.release_date}</p>
                        <button class="remove-favorite-button" data-movie-id="${movieDetails.id}">Remove from Favorites</button>
                    `;
                    movieItem.querySelector('img').addEventListener('click', showMovie);
                    movieItem.querySelector('h3').addEventListener('click', showMovie);
                    movieItem.querySelector('.remove-favorite-button').addEventListener('click', function() {
                        removeFromFavorites(movieDetails.id);
                    });
                    favoritesList.appendChild(movieItem);
                })
                .catch(error => console.error('Error fetching favorite movie:', error));
        });
    } else {
        favoritesList.innerHTML = "<p class='maxos'>Search for any movie and add your favorites to see them here.Click on Movie to watch it</p>";
    }
}

function viewDetails(movieId) {
    fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=d9cf93b96321e53a7172e2e0a574d66d`)
        .then(response => response.json())
        .then(movieDetails => {
            const detailsModal = document.getElementById('details-modal');
            const movieDetailsDiv = document.getElementById('movie-details');
            movieDetailsDiv.innerHTML = `
                <h2>${movieDetails.title}</h2>
                <p>${movieDetails.overview}</p>
                <p><strong>Release Date:</strong> ${movieDetails.release_date}</p>
                <p><strong>Rating:</strong> ${movieDetails.vote_average}</p>
                <div id="trailer-container"></div>
                <textarea id="review-text" placeholder="Write your review"></textarea>
                <button id="submit-review-button">Submit Review</button>
                <div id="reviews-list"></div>
            `;
            detailsModal.style.display = 'block';
            fetchMovieTrailer(movieId);

            document.getElementById('submit-review-button').onclick = () => submitReview(movieId);
            displayReviews(movieId);
        })
        .catch(error => console.error('Error fetching movie details:', error));
}

function fetchMovieTrailer(movieId) {
    fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=d9cf93b96321e53a7172e2e0a574d66d`)
        .then(response => response.json())
        .then(data => {
            const trailerContainer = document.getElementById('trailer-container');
            trailerContainer.innerHTML = '';
            const trailers = data.results.filter(video => video.type === 'Trailer');
            if (trailers.length > 0) {
                const trailer = trailers[0];
                trailerContainer.innerHTML = `
                    <iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>
                `;
            } else {
                trailerContainer.innerHTML = '<p>No trailers available.</p>';
            }
        })
        .catch(error => console.error('Error fetching movie trailer:', error));
}

function submitReview(movieId) {
    const reviewText = document.getElementById('review-text').value;
    if (!reviews[movieId]) {
        reviews[movieId] = [];
    }
    reviews[movieId].push(reviewText);
    localStorage.setItem('reviews', JSON.stringify(reviews));
    displayReviews(movieId);
    document.getElementById('review-text').value = '';
}

function displayReviews(movieId) {
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.innerHTML = '';
    if (reviews[movieId] && reviews[movieId].length > 0) {
        reviews[movieId].forEach(review => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.innerHTML = `<p>${review}</p>`;
            reviewsList.appendChild(reviewItem);
        });
    } else {
        reviewsList.innerHTML = '<p>No reviews yet.</p>';
    }
}

// Close the video modal when the close button is clicked
const videoModal = document.getElementById('video-modal');
const closeVideoButton = document.querySelector('.close-button');
closeVideoButton.addEventListener('click', function() {
    const videoPlayer = document.getElementById('video-player');
    videoPlayer.src = ''; // Clear the src attribute to stop the video
    videoModal.style.display = 'none';
});

// Close the details modal when the close button is clicked
const detailsModal = document.getElementById('details-modal');
const closeDetailsButton = document.querySelector('.close-details-button');
closeDetailsButton.addEventListener('click', function() {
       detailsModal.style.display = 'none';
});

// Close the modals when the user clicks outside of them
window.onclick = function(event) {
    if (event.target == videoModal) {
        const videoPlayer = document.getElementById('video-player');
        videoPlayer.src = ''; // Clear the src attribute to stop the video
        videoModal.style.display = 'none';
    } else if (event.target == detailsModal) {
        detailsModal.style.display = 'none';
    }
};

// Initialize the application by displaying favorites on page load
displayFavorites();

