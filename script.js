let btn = document.querySelector("#btn");
let content = document.querySelector("#content"); 
let voice = document.querySelector("#voice");
let weatherEl = document.querySelector("#weather");
let noteListEl = document.querySelector("#noteList");
let toggleScheduleBtn = document.querySelector("#toggleScheduleBtn");
let schedulePanel = document.querySelector("#schedule-panel");

function speak(text) {
    let text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.pitch = 1;
    text_speak.volume = 1;
    text_speak.lang = "en";
    window.speechSynthesis.speak(text_speak);
    console.log("Speaking:", text);
}

function wishMe() {
    let day = new Date();
    let hours = day.getHours();
    let greeting = hours < 12 ? "Good Morning Maam,how can I help you?" : hours < 16 ? "Good Afternoon Maam, how can I help you?" : "Good Evening Maam, how can I help you?";
    speak(greeting);
}

window.addEventListener('load', () => {
    wishMe();
    displayNotes();
});

let recognition;
if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
    console.log("Using standard SpeechRecognition API.");
} else if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    console.log("Using webkitSpeechRecognition API.");
} else {
    console.error("Speech Recognition API is not supported in this browser.");
    btn.disabled = true;
    content.innerText = "Speech Recognition not supported in your browser."; 
}

if (recognition) {
    recognition.onstart = () => {
        console.log('Speech recognition service started.');
        voice.style.display = "block";
        btn.style.display = "none";
        content.innerText = "Listening..."; 
    };

    recognition.onresult = (event) => {
        let currentIndex = event.resultIndex;
        let transcript = event.results[currentIndex][0].transcript;
        content.innerText = transcript; // Re-added
        console.log("Transcript received:", transcript);
        takeCommand(transcript.toLowerCase());
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event);
        voice.style.display = "none";
        btn.style.display = "flex";
        content.innerText = "Click to Speak"; 
        if (event.error === 'no-speech') {
            speak("Sorry, I didn't hear anything. Please try again.");
        } else if (event.error === 'not-allowed') {
            speak("Microphone access denied. Please allow microphone in browser settings.");
        } else if (event.error === 'aborted') {
            speak("Speech recognition was stopped.");
        } else {
            speak("There was an error with speech recognition. Please try again.");
        }
    };

    recognition.onend = () => {
        console.log('Speech recognition service ended.');
        voice.style.display = "none";
        btn.style.display = "flex";
    };

    btn.addEventListener("click", () => {
        console.log("Button clicked. Attempting to start recognition...");
        recognition.start();
    });
}

if (toggleScheduleBtn && schedulePanel) {
    toggleScheduleBtn.addEventListener('click', () => {
        schedulePanel.classList.toggle('show-schedule');
    });
}

function saveNoteToStorage(note) {
    const notes = getNotesFromStorage();
    notes.push(note);
    localStorage.setItem('virtualAssistantNotes', JSON.stringify(notes));
    displayNotes();
}

function getNotesFromStorage() {
    const notes = localStorage.getItem('virtualAssistantNotes');
    return notes ? JSON.parse(notes) : [];
}

function clearNotesFromStorage() {
    localStorage.removeItem('virtualAssistantNotes');
    displayNotes();
}

function deleteNoteFromStorage(index) {
    let notes = getNotesFromStorage();
    if (index > -1 && index < notes.length) {
        notes.splice(index, 1);
        localStorage.setItem('virtualAssistantNotes', JSON.stringify(notes));
        displayNotes();
        speak("Note deleted.");
    } else {
        speak("Sorry, I couldn't find that note to delete.");
    }
}

function displayNotes() {
    const notes = getNotesFromStorage();
    noteListEl.innerHTML = '';
    if (notes.length === 0) {
        noteListEl.textContent = "No notes saved yet.";
    } else {
        notes.forEach((note, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>Note ${i + 1}: ${note}</span>
                <button class="delete-note-btn" data-index="${i}">X</button>
            `;
            noteListEl.appendChild(li);
        });

        document.querySelectorAll('.delete-note-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const indexToDelete = parseInt(event.target.dataset.index);
                if (confirm(`Are you sure you want to delete "Note ${indexToDelete + 1}: ${notes[indexToDelete]}"?`)) {
                    deleteNoteFromStorage(indexToDelete);
                }
            });
        });
    }
}

async function fetchWeather(city = 'Mysuru') {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=db550831da8c582c90952ad850ea92ed&units=metric`);
        const data = await res.json();

        if (data.cod === '404') {
            weatherEl.innerHTML = `Weather for "${city}" not found.`;
            speak(`Sorry, I couldn't find the weather for ${city}.`);
            return;
        }

        const iconCode = data.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

        const output = `Weather in ${data.name}: ${data.weather[0].description}, ${data.main.temp}°C`;

        weatherEl.innerHTML = `
            <img src="${iconUrl}" alt="Weather Icon" style="vertical-align:middle;width:50px;height:50px;">
            <span>${output}</span>
        `;
        speak(output);
    } catch (err) {
        weatherEl.textContent = "Unable to fetch weather.";
        speak("Sorry, I couldn't get the weather.");
    }
}

async function fetchJoke() {
    try {
        const response = await fetch('https://v2.jokeapi.dev/joke/Any?type=single');
        const data = await response.json();
        if (data && data.joke) {
            speak(data.joke);
        } else {
            speak("Sorry, I couldn't fetch a joke right now.");
        }
    } catch (error) {
        console.error("Error fetching joke:", error);
        speak("I'm having trouble fetching jokes at the moment. Please try again later.");
    }
}

async function fetchRandomFact() {
    try {
        const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
        const data = await response.json();
        if (data && data.text) {
            speak(data.text);
        } else {
            speak("Sorry, I couldn't fetch a random fact right now.");
        }
    } catch (error) {
        console.error("Error fetching random fact:", error);
        speak("I'm having trouble fetching random facts at the moment. Please try again later.");
    }
}

    function takeCommand(message) {
    console.log("Processing command:", message);
    weatherEl.innerHTML = '';

    if (message.includes("hello") || message.includes("hey")) {
        speak("hello Maam, how can I help you?");
    }
    else if (message.includes("who are you")) {
        speak("I am a personal virtual assistant.");
    } else if (message.includes("open my college archive")) {
        speak("Opening soearchive...");
        window.open("https://soearchive.netlify.app/", "_blank");
    } else if (message.includes("news")) {
        speak("opening top news for the day ...");
        window.open("https://timesofindia.indiatimes.com/", "_blank");
    } else if (message.includes("update me about stock prices")) {
        speak("sure ...");
        window.open("https://www.moneycontrol.com/", "_blank");
    } else if (message.includes("open youtube")) {
        speak("Opening YouTube...");
        window.open("https://www.youtube.com/", "_blank");
    } else if (message.includes("open google")) {
        speak("Opening Google...");
        window.open("https://google.com/", "_blank");
    } else if (message.includes("open spotify")) {
        speak("Opening Spotify...");
        window.open("https://open.spotify.com/", "_blank");
    } else if (message.includes("open facebook")) {
        speak("Opening Facebook...");
        window.open("https://facebook.com/", "_blank");
    } else if (message.includes("open instagram")) {
        speak("Opening Instagram...");
        window.open("https://instagram.com/", "_blank");
    } else if (message.includes("open whatsapp")) {
        speak("Opening WhatsApp...");
        window.open("https://web.whatsapp.com/", "_blank");
    }
    else if (message.includes("play youtube") || message.includes("search youtube for") || message.includes("play video")) {
        let query = message.replace(/play (youtube|video)|search youtube for/i, "").trim();
        if (query) {
            speak(`Searching YouTube for ${query}`);
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, "_blank");
        } else {
            speak("What video would you like to play on YouTube?");
        }
    } else if (message.includes("open calculator")) {
        speak("Opening online calculator.");
        window.open("https://www.google.com/search?q=online+calculator", "_blank");
    } else if (message.includes("open notepad") || message.includes("open notes app")) {
        speak("Opening online notepad.");
        window.open("https://notepad-online.com/", "_blank");
    } else if (message.includes("who is") || message.includes("what is")) {
    let searchTerm = message.replace("who is", "").replace("what is", "").trim();
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${searchTerm}`)
        .then(res => res.json())
        .then(data => {
            if (data.extract) speak(data.extract);
            else speak(`Sorry, I couldn't find information on ${searchTerm}.`);
        })
        .catch(() => speak("Error fetching Wikipedia data."));
}

    // Time & Date
    else if (message.includes("time")) {
        let time = new Date().toLocaleString(undefined, {
            hour: "numeric",
            minute: "numeric"
        });
        speak(time);
    } else if (message.includes("date")) {
        let date = new Date().toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
        speak(date);
    }
    else if (message.includes("weather")) {
        const match = message.match(/weather in ([a-zA-Z ]+)/);
        if (match && match[1]) {
            fetchWeather(match[1].trim());
        } else {
            fetchWeather();
        }
    }
    else if (message.includes("take a note") || message.includes("note that") || message.includes("make a note")) {
        const noteMatch = message.match(/(?:take a note|note that|make a note)\s+(.+)/i);
        if (noteMatch && noteMatch[1]) {
            const newNote = noteMatch[1].trim();
            saveNoteToStorage(newNote);
            speak(`Note: "${newNote}" saved.`);
        } else {
            speak("What would you like me to make a note of?");
        }
    } else if (message.includes(" schedule ") || message.includes("show my schedule") || message.includes("show my schedules")) {
        const notes = getNotesFromStorage();
        if (notes.length === 0) {
            speak("You have no notes saved.");
        } else {
            speak("Here is your schedule:");
            notes.forEach((note, index) => {
                speak(`Note ${index + 1}: ${note}`);
            });
        }
    } else if (message.includes("delete note number")) {
        const match = message.match(/delete note number (\d+)/);
        if (match && match[1]) {
            const indexToDelete = parseInt(match[1]) - 1;
            let notes = getNotesFromStorage();
            if (indexToDelete >= 0 && indexToDelete < notes.length) {
                if (confirm(`Are you sure you want to delete "Note ${indexToDelete + 1}: ${notes[indexToDelete]}"?`)) {
                    deleteNoteFromStorage(indexToDelete);
                } else {
                    speak("Note deletion cancelled.");
                }
            } else {
                speak("Sorry, I couldn't find a note with that number.");
            }
        } else {
            speak("Please tell me which note number you would like to delete.");
        }
    }
    else if (message.includes("clear my notes") || message.includes("delete all notes")) {
        if (confirm("Are you sure you want to clear all your notes?")) {
            clearNotesFromStorage();
            speak("All notes have been cleared.");
        } else {
            speak("Cancelled. Your notes are safe.");
        }
    }
    else if (message.includes("show my schedule for the week") || message.includes("open schedule")) {
        if (schedulePanel && !schedulePanel.classList.contains('show-schedule')) {
            schedulePanel.classList.add('show-schedule');
            speak("Schedule shown.");
        } else {
            speak("Schedule is already visible.");
        }
    } else if (message.includes("hide schedule") || message.includes("close schedule")) {
        if (schedulePanel && schedulePanel.classList.contains('show-schedule')) {
            schedulePanel.classList.remove('show-schedule');
            speak("Schedule hidden.");
        } else {
            speak("Schedule is already hidden.");
        }
    }
    // Joke Command
    else if (message.includes("tell me a joke") || message.includes("make me laugh") || message.includes("joke")) {
        fetchJoke();
    }
    // Random Fact Command
    else if (message.includes("tell me a random fact") || message.includes("give me a fact") || message.includes("a random fact")) {
        fetchRandomFact();
    }
    else if (message.includes("News")) {
        fetchRSSNews();
    }
    // Fallback (General Search)
    else {
        let search_query = message.replace(/cyrus/g, "").trim();
        if (search_query) {
            let finalText = "this is what I found on the internet regarding " + search_query;
            speak(finalText);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(search_query)}`, "_blank");
        } else {
            speak("I'm sorry, I didn't understand that command. Please try again.");
        }
    }
}