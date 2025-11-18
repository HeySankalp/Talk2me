document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check credentials
    if (username === 'demo@datopic.com' && password === 'DemoUser@123#') {
        localStorage.setItem('webauth', 'true');
        checkIfJournyeyRedirect()
    } else {
        alert('Invalid username or password');
    }
});


function checkIfJournyeyRedirect() {
    const redirectURL = sessionStorage.getItem('redirectAfterLogin');
    if (redirectURL) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectURL;
    } else {
        window.location.href = '/meet';
    }
}

(function checkIsAuthenticated() {
    const isAuthenticated = localStorage.getItem('webauth');

    if (isAuthenticated == 'true') {
        checkIfJournyeyRedirect()
    }
})();