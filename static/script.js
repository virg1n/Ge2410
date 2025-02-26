let recognition;
let isSpeaking = false;
let speechToText = "";

// Initialize speech recognition
function startSpeech() {
    if (isSpeaking) return; // Prevent starting a new recognition session if one is already active.

    recognition = new window.webkitSpeechRecognition();
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = function(event) {
        let transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        speechToText = transcript;
    };

    recognition.onend = function() {
        // Only send the request after the recognition has ended
        if (speechToText.trim() !== "") { // Ensure the text is not empty
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

    recognition.start();
    isSpeaking = true;
}

function stopSpeech() {
    if (isSpeaking) {
        recognition.stop();
        isSpeaking = false;
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
