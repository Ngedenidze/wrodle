'use strict';

// on content load
document.addEventListener('DOMContentLoaded', () => {
  const $ = document.querySelector.bind(document);

  // login link action
  $('#loginLink').addEventListener('click', openLoginScreen);

  // register link action
  $('#registerLink').addEventListener('click', openRegisterScreen);


  // sign In button action
  $('#loginBtn').addEventListener('click', () => {
    const loginUsername = $('#loginUsername').value;
    const loginPassword = $('#loginPassword').value;

    if (!loginUsername || !loginPassword) {
      showError('Username and password are required.');
      return;
    }

    //data
    const data = {
      username: loginUsername,
      password: loginPassword,
    };

    fetch(`https://us-central1-wrodle-30466.cloudfunctions.net/function/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((doc) => {
        console.log(doc); // for debug
        if (doc.error) {
          showError(doc.error);
        } else {
          openHomeScreen(doc);
        }
      })
      .catch(err => showError('ERROR: ' + err));
  });


  // register button action
  $('#registerBtn').addEventListener('click', () => {
    const registerUsername = $('#registerUsername').value;
    const registerPassword = $('#registerPassword').value;
    const registerName = $('#registerName').value;
    const registerEmail = $('#registerEmail').value;

    if (!registerUsername || !registerPassword || !registerName || !registerEmail) {
      showError('All fields are required.');
      return;
    }

    const data = {
      username: registerUsername,
      password: registerPassword,
      name: registerName,
      email: registerEmail,
    };

    fetch('https://us-central1-wrodle-30466.cloudfunctions.net/function/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((doc) => {
        if (doc.error) {
          showError(doc.error);
        } else {
          openHomeScreen(doc);
        }
      })
      .catch(err => showError('ERROR: ' + err));
  });

  // helper functions
  function showError(err) {
    $('#error').innerText = err;
  }

  function resetInputs() {
    const inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
      inputs[i].value = '';
    }
  }

  function openHomeScreen(doc) {
    const token = doc.auth;
    localStorage.setItem('token', token);
    window.location.href = "/game.html";
  }


  function openLoginScreen() {
    // hide other screens, clear inputs, clear error
    $('#registerScreen').classList.add('hidden');
    $('#homeScreen').classList.add('hidden');
    resetInputs();
    showError('');

    // reveal login screen
    $('#loginScreen').classList.remove('hidden');
  }


  function openRegisterScreen() {
    // hide other screens, clear inputs, clear error
    $('#loginScreen').classList.add('hidden');
    $('#homeScreen').classList.add('hidden');
    resetInputs();
    showError('');

    // reveal register screen
    $('#registerScreen').classList.remove('hidden');
  }
  // Initial screen setup
  openLoginScreen();
});
