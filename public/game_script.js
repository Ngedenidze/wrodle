//doc
const $ = document.querySelector.bind(document);
// constants and variables
const open = document.getElementById("open");
const rules = document.getElementById("rules");
const restart = document.getElementById("restart");
const rules_container = document.getElementById('rules_container');
const settings_container = document.getElementById('settings_container');
const close = document.getElementById('close');
const close_settings = document.getElementById('close_settings');
const root = document.getElementById('root');
const game_containter = document.getElementById('game_container');
const different_words = ["FIELD", "BEGIN", "SOLVE", "LANDS", "STICK"];
const words_level = 0;
var correct_position = []
var correct_letter = []
var array_of_words;
var in_level = 0;

// get information and authorization on load
document.addEventListener('DOMContentLoaded', () => {
    getUserInformation();
    unauthorized();
});

// fetch with authentication
function getUserInformation() {
    // get the token from local storage
    const token = localStorage.getItem('token');
    fetch(`https://us-central1-wrodle-30466.cloudfunctions.net/function/users/${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then((response) => response.json())
        .then((data) => {
            // Handle the user information
            console.log(data);
            $('#username').innerText = data.username;
            $('#name').innerText = data.user;
            $('#updateEmail').innerText = data.email;

        })
        .catch((err) => {
            console.error('Error fetching user information:', err)
            window.location.href = '/index.html';
        });
}

// debug
function unauthorized() {
    const username = $('#username').innerText;
    if (username === undefined) {
        console.log('Username is undefined');
    } else {
        console.log('Username is defined');
    }
}
// check level
switch (sessionStorage.getItem('level')) {
    case "FIELD":
        { in_level = 0; break; }
    case "BEGIN":
        { in_level = 1; break; }
    case "SOLVE":
        { in_level = 2; break; }
    case "LANDS":
        { in_level = 3; break; }
    case "STICK":
        { in_level = 4; break; }
    default:
        { in_level = 0; break; }

}



// level display
var heading = $(".title");
if (heading !== null) {
    heading.innerHTML = "Word Number " + (in_level + 1);
}

// fetching the words   
// fetch https://raw.githubusercontent.com/charlesreid1/five-letter-words/master/sgb-words.txt
try {
    jQuery.get('https://raw.githubusercontent.com/charlesreid1/five-letter-words/master/sgb-words.txt', function (data) {
        array_of_words = JSON.stringify(data).replace(/"/g, '').replaceAll('\\n', ' ').split(/\s+/);
    });
}
catch (error) {
    console.log("there was an error!");
    console.error(error);
};


//MODALS
if (rules || close) {
    rules.addEventListener('click', () => {
        rules_container.classList.add('popup');
        settings_container.classList.add('hidden');
        root.classList.add('blured');
    });
    close.addEventListener('click', () => {
        rules_container.classList.remove('popup');
        settings_container.classList.remove('hidden');
        root.classList.remove('blured');
    });
    rules.addEventListener('keydown', (event) => {
        var key = event.key;
        if (key == "Escape") {
            rules_container.classList.remove('popup');
            root.classList.remove('blured');
        }
    });
};
if(open || close_settings){
    open.addEventListener('click', () => {
        settings_container.classList.add('popup');
        rules_container.classList.add('hidden');
        root.classList.add('blured');
    });
    close_settings.addEventListener('click', () => {
        rules_container.classList.remove('hidden');
        settings_container.classList.remove('popup');
        root.classList.remove('blured');
    });
    open.addEventListener('keydown', (event) => {
        var key = event.key;
        if (key == "Escape") {
            settings_container.classList.remove('popup');
            root.classList.remove('blured');

        }
    });
};


//ROWS
var rows = game_containter.children;

var words = ['', '', '', '', '', ''];
var in_row = 0;
var mywords = [];
// fill out the boxes with letters
document.addEventListener('keyup', function (event) {

    var s = event.key;
    var key = event.keyCode || event.charCode;

    // input from keyboards
    for (var i = 0; i < rows[0].children.length; i++) {

        if (rows[in_row].children[i].firstElementChild.value == '' && String.fromCharCode(event.keyCode).match(/(\w|\s)/g)
            && key != 9 && key != 13) {
            rows[in_row].children[i].firstElementChild.value = s.toUpperCase();
            mywords[in_row] += s.toLowerCase();
            mywords[in_row] = mywords[in_row].replace("undefined", "");
            break;
        }
    }
    // backspace
    if (key == 8 || key == 46) {
        // if()
        for (var j = 4; j >= 0; j--)
            if (rows[in_row].children[j].firstElementChild.value != '') {
                rows[in_row].children[j].firstElementChild.value = '';
                mywords[in_row] = mywords[in_row].replace(mywords[in_row][j], '');
                break;
            }
    }


});


// enter click actions
document.addEventListener(
    'keydown', (event) => {

        // if not 'enter key' just exit here
        if (event.which == 13) {

            if (rows[in_row].children[4].firstElementChild.value != '') {
                var checkable_word = String(mywords[in_row]).substring(0, 5);
                if (array_of_words.includes(checkable_word)) {
                    for (var i = 0; i < rows[in_row].children.length; i++) {
                        words[in_row] += rows[in_row].children[i].firstElementChild.value;
                    }
                    checkTheWord();
                }
                else {
                    mywords[in_row] = '';
                    swal({
                        title: "Wrong word!",
                        text: "This word doesn't exsist, try another one!",
                        icon: "warning",
                        dangerMode: true,
                    });
                }




            }
            else {
                swal({
                    title: "Not enough letters!",
                    text: "You have to fill out the row!",
                    icon: "warning",
                    dangerMode: true,
                });
            }

        }
    });


// word checker function
function checkTheWord() {

    //save the word to overwrite on it
    var copy_of_guess = [...different_words[in_level]];
    var guessed_correctly = 0;

    //mark correct guesses and take the letter out of   
    for (var k in copy_of_guess)
        if (copy_of_guess[k] == words[in_row][k]) {
            correct_position[k] = 1;
            different_words[in_level][k] = '';
            rows[in_row].children[k].setAttribute('id', 'position_guessed_correctly');
            guessed_correctly++;

            // if all letters are marked remove event listeners and show modal

            if (correct_position.filter(x => x == 1).length == 5) {
                switch (sessionStorage.getItem('level')) {
                    case "FIELD":
                        { sessionStorage.setItem("level", "BEGIN"); break; }
                    case "BEGIN":
                        { sessionStorage.setItem("level", "SOLVE"); break; }
                    case "SOLVE":
                        { sessionStorage.setItem("level", "LANDS"); break; }
                    case "LANDS":
                        { sessionStorage.setItem("level", "STICK"); break; }
                    case "STICK":
                        { sessionStorage.setItem("level", "END"); break; }
                    default:
                        {
                            sessionStorage.setItem("level", "BEGIN"); break;
                        }
                }
                setTimeout(() => {

                    sessionStorage.setItem("level", "BEGIN");
                    swal({
                        title: "You've Won!",
                        text: "You have found the word!",
                        icon: "success",
                    });
                }, 300);
                document.removeEventListener('keydown', event);
                location.reload();

            }




        }

    // Check if there are anymore letters guessed in wrong position 
    for (var k in different_words[in_level])
        if (!correct_position[k]) {
            if (different_words[in_level].includes(words[in_row][k])) {
                rows[in_row].children[k].setAttribute('id', 'letter_guessed_correctly');
            }
            else { console.log('letter is wrong!') }
        }

    // don't go over 5 rows
    if (in_row == 5) alert('game over');
    else in_row++;



}
// update button action - email and name information update
$('#updateBtn').addEventListener('click', () => {
    // check to make sure no fields aren't blank
    if (!$('#updateName').value || !$('#updateEmail').value) {
        showError('Fields cannot be blank.');
        return;
    }
    // grab all user info from input fields

    //debug
    // console.log("name " +$('#updateName').value + " email " + $('#updateEmail').value+ " " + $('#username').innerText);
    const data = {
        username: $('#username').innerText,
        name: $('#updateName').value, 
        email: $('#updateEmail').value
    };
    // PATCH /users/{username}, where {username} is $('#username').innerText
    // convert data (defined above) to json, and send via PATCH to /users/{username}
    // decode response from json to object called doc
    // if doc.error, showError(doc.error)
    // otherwise, if doc.ok,
    // alert("Your name and email have been updated.");
    // use .catch(err=>showError('ERROR: '+err)}) to show any other errors
    fetch(`https://us-central1-wrodle-30466.cloudfunctions.net/function/users/${$('#username').innerText}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then((r) => r.json())
        .then((doc) => {
            if (doc.error)
                showError(doc.error);
            else
                {
                $('#name').innerText = doc.user;
                alert("Your name and email have been updated.");
                location.reload();
                }
        })
        .catch(err => showError('ERROR: ' + err))
});
// Delete button action
$('#deleteBtn').addEventListener('click', () => {
    // confirm that the user wants to delete
    if (!confirm("Are you sure you want to delete your profile?"))
        return;

    const username = $('#username').innerText;
    const token = localStorage.getItem('token'); 

    // DELETE /users/{username}, where {username} is $('#username').innerText
    // decode response from json to object called doc
    // if doc.error, showError(doc.error)
    // otherwise, openLoginScreen()
    // use .catch(err=>showError('ERROR: '+err)}) to show any other errors'
    // sending token with header
    fetch(`https://us-central1-wrodle-30466.cloudfunctions.net/function/users/${username}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        }
    })
    .then((r) => r.json())
    .then((doc) => {
        if (doc.error) {
            showError(doc.error);
        } else {
            localStorage.removeItem('token');
            window.location.href = "/index.html";
        }
    })
    .catch(err => showError('ERROR: ' + err))
});


// logout link action
$('#logoutLink').addEventListener('click', () => {
    const username = $('#username').innerText;

    fetch(`https://us-central1-wrodle-30466.cloudfunctions.net/function/logout/${username}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (response.ok) {
            rules_container.classList.remove('popup');
            root.classList.remove('blured');
            localStorage.removeItem('token');
            window.location.href = "/index.html";
            

        } else {
            response.json().then(data => {
                showError('ERROR: ' + data.error);
            });
        }
    })
    .catch(err => showError('ERROR: ' + err));
});


// error helped function
function showError(err) {
    $('#error').innerText = err;
}

// restart the game
function restart_the_game() {
    location.reload();
}

