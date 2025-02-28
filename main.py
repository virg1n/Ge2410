from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
import openai
import os
from dotenv import load_dotenv
from gtts import gTTS
import io
import re
import datetime
from datetime import datetime


load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'my_secret_key')  # Use a secure key for sessions

openai.api_key = os.getenv('OPENAI_API_KEY')

chat_history = [{"role": "system", "content": "You are a helpful assistant for the elderly from Vviky Company, always kind, clear, and supportive. Keep answers short"}]

@app.route('/')
def index():
    if 'user' in session:
        # Get user data from session
        user_data = session['user']
        # Update the prompt with user info (including medications and illness)
        prompt = f"User details: Name: {user_data['name']}, Age: {user_data['age']}, Illness: {user_data['illness']}, Medications: {user_data['medications']}, Usage: {user_data['med_usage']} times a day. Last usage: {user_data['last_usage']}. Provide assistance accordingly."
        chat_history[0]['content'] += prompt  # Update system prompt
    return render_template('index.html')

@app.route('/about_us')
def about_us():
    return render_template('about_us.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Get user data from the form
        user_data = {
            'name': request.form['name'],
            'age': request.form['age'],
            'illness': request.form['illness'],
            'medications': request.form['medications'],
            'med_usage': request.form['med_usage'],
            'last_usage': request.form['last_usage']
        }

        # Save user data in session
        session['user'] = user_data
        
        # Redirect to the registered page
        return redirect(url_for('registered'))
    
    return render_template('register.html')

@app.route('/registered')
def registered():
    if 'user' in session:
        user_data = session['user']
        # Update the prompt with user info (including medications and illness)
        prompt = f"User details: Name: {user_data['name']}, Age: {user_data['age']}, Illness: {user_data['illness']}, Medications: {user_data['medications']}, Usage: {user_data['med_usage']} times a day. Last usage: {user_data['last_usage']}. Provide assistance accordingly. Current time: {datetime.today()}"
        chat_history[0]['content'] = prompt  # Update system prompt
    return render_template('index.html')

@app.route('/ask_gpt', methods=['POST'])
def ask_gpt():
    print("Received request:", request.data)  # Log the raw data
    print("Received JSON:", request.json)  # Log the parsed JSON
    question = request.json.get('question')
    if question:
        # Check for emergency phrases or call requests before getting chatbot response
        if "call 911" in question.lower() or "i feel really bad" in question.lower():
            return jsonify({"alert": "Calling 911..."}), 200
        match = re.match(r"call to (.*)", question.lower())
        if match:
            person = match.group(1)
            return jsonify({"alert": f"Calling to {person}..."}), 200
        match = re.match(r"call (.*)", question.lower())
        if match:
            person = match.group(1)
            return jsonify({"alert": f"Calling to {person}..."}), 200

        # Get response from GPT if no emergency detected
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
