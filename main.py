import os
from flask import Flask, render_template, request, jsonify, send_file
import openai
from dotenv import load_dotenv
from gtts import gTTS
import io

load_dotenv()  # Load environment variables from .env

app = Flask(__name__)

# Set the OpenAI API key from environment variable
openai.api_key = os.getenv('OPENAI_API_KEY')

# Initialize chat history
chat_history = [{"role": "system", "content": "You are a helpful assistant."}]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about_us')
def about_us():
    return render_template('about_us.html')

@app.route('/chat', methods=['POST'])
def chat():
    question = request.json.get('question')
    if question:
        answer = get_chatbot_response(question)
        return jsonify({"answer": answer})
    return jsonify({"error": "Missing question parameter"}), 400

@app.route('/text_to_speech', methods=['POST'])
def text_to_speech():
    text = request.json.get('text')
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Generate speech using gTTS
    tts = gTTS(text=text, lang='en')
    audio_stream = io.BytesIO()
    tts.write_to_fp(audio_stream)  # Corrected method to write audio to BytesIO
    audio_stream.seek(0)
    
    return send_file(audio_stream, mimetype='audio/mp3', as_attachment=True, download_name='response.mp3')

def get_chatbot_response(question):
    global chat_history
    chat_history.append({"role": "user", "content": question})
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=chat_history,
        temperature=0.7
    )
    
    answer = response['choices'][0]['message']['content']
    chat_history.append({"role": "assistant", "content": answer})
    
    return answer

if __name__ == '__main__':
    app.run(debug=True)
