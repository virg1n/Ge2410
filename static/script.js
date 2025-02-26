let recognition;
let isSpeaking = false;
let speechToText = "";

// Initialize speech recognition
function startSpeech() {
    speechToText = ""
    if (isSpeaking) return; // Prevent starting a new recognition session if one is already active.

    recognition = new window.webkitSpeechRecognition();
    recognition.interimResults = false; // Don't give results while speaking
    recognition.continuous = false; // Stop after one sentence

    // Set language to English (en-US)
    recognition.lang = 'en-US';

    // Event handler for when results are available
    recognition.onresult = function(event) {
        let transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        speechToText = transcript;
        console.log("Speech Transcription: ", speechToText);
    };

    // Event handler for when recognition has ended
    recognition.onend = function() {
        // Only send the request after recognition has completely ended
        if (speechToText.trim() !== "") { // Ensure the text is not empty
            console.log("Sending Speech to GPT: ", speechToText);
            fetch('/ask_gpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: speechToText })  // Ensure the correct parameter name is used
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Response not OK');
                }
                return response.json();
            })
            .then(function(data) {
                document.getElementById('bot-response').textContent = data.answer;
                playSpeech(data.answer);
            })
            .catch(function(error) {
                console.error('Error:', error);
            });
        }
    };

    // Error handler for failed speech recognition
    recognition.onerror = function(event) {
        console.error("Speech Recognition Error: ", event.error);
        alert("Sorry, there was an error with speech recognition. Please try again.");
    };

    recognition.start();
    isSpeaking = true;
    console.log('Recognition started');
}

function stopSpeech() {
    if (isSpeaking) {
        recognition.stop(); // Stop recognition
        isSpeaking = false;
        console.log('Recognition stopped');
    }
}

// Function to play speech response
function playSpeech(text) {
    const audio = document.getElementById('response-audio');
    
    fetch('/text_to_speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Failed to get audio');
        }
        return response.blob();
    })
    .then(function(blob) {
        const audioURL = URL.createObjectURL(blob);
        audio.src = audioURL;
        audio.style.display = 'block';
        audio.play();
    })
    .catch(function(error) {
        console.error('Error:', error);
    });
}
