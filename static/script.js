// Speech-to-Text setup
const speakButton = document.getElementById('speak');
const recognition = new window.webkitSpeechRecognition();
recognition.interimResults = false;
recognition.continuous = false;

recognition.onresult = function(event) {
    let transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

    document.getElementById('question').value = transcript; 
    speakButton.click();  
};

speakButton.onclick = function() {
    recognition.start();
};

// Handle form submission
document.getElementById('chat-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var question = document.getElementById('question').value;

    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({question: question})
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Response not OK');
        }
        return response.json();
    })
    .then(function(data) {
        document.getElementById('bot-response').textContent = data.answer;

        // Convert the response to speech
        playSpeech(data.answer);
    })
    .catch(function(error) {
        console.error('Error:', error);
    });
});

// Function to play speech response
function playSpeech(text) {
    const audio = document.getElementById('response-audio');
    
    fetch('/text_to_speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({text: text})
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
