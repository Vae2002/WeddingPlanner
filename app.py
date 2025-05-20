from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from sqlalchemy import create_engine
import pandas as pd
from datetime import datetime
import os
import base64

app = Flask(__name__)
app.secret_key = 'laststeftoeunity'

UPLOAD_FOLDER = 'static/captures'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.context_processor
def inject_year():
    return {'current_year': datetime.now().year}

csv_url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxhbKO06Y36vTyEiFgxZXXVtWkNebIQ-3diUm5xpAtMT1uHJIGF4Jvkt3bm8dKYo-5C6PkdQwrAX21/pub?output=csv'
df = pd.read_csv(csv_url)

# Connect and save to SQLite
engine = create_engine('sqlite:///guest.db')
df.to_sql('guest_database', con=engine, if_exists='replace', index=False)

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        if username:
            # Check if user exists
            user_df = pd.read_sql("SELECT * FROM guest_database WHERE username = ?", con=engine, params=(username,))
            if not user_df.empty:
                session['username'] = username
                return redirect(url_for('home'))
            else:
                return render_template('login.html', error="Username not found.")
    return render_template('login.html')

@app.route('/home')
def home():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    user_df = pd.read_sql("SELECT * FROM guest_database WHERE username = ?", con=engine, params=(username,))
    user_data = user_df.iloc[0].to_dict() if not user_df.empty else {}

    return render_template('home.html', user=user_data, show_footer = True)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/search')
def search():
    image_folder = os.path.join('static', 'images')
    image_files = [
        os.path.join(file)
        for file in os.listdir(image_folder)
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))
    ]
      # Debugging output
    print("Images sent to template:", image_files)
    return render_template('search.html', images=image_files, show_footer=True)

def map_view():
    latitude = 37.4219999
    longitude = -122.0840575
    label = "My+Location"
    
    # Google Maps URL for redirection
    maps_url = f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}"

    return render_template('search.html', lat=latitude, lng=longitude, maps_url=maps_url)

@app.route('/capture')
def capture():
    return render_template('capture.html', show_footer=False)

@app.route('/save-photo', methods=['POST'])
def save_photo():
    data = request.get_json()
    image_data = data['image']
    
    header, encoded = image_data.split(',', 1)
    img_bytes = base64.b64decode(encoded)

    filename = f"capture_{len(os.listdir(UPLOAD_FOLDER)) + 1}.jpg"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    with open(file_path, 'wb') as f:
        f.write(img_bytes)
    
    return jsonify({"message": "Photo saved successfully!", "filename": filename})

@app.route('/delete-photo/<filename>', methods=['DELETE'])
def delete_photo(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({"message": "Photo deleted."})
    else:
        return jsonify({"error": "File not found."}), 404


@app.route('/messenger')
def messenger():
    return render_template('messenger.html', show_footer=False)

@app.route('/voice_call')
def voice_call():
    return render_template('voice_call.html', show_footer=False)

@app.route('/video_call')
def video_call():
    return render_template('video_call.html', show_footer=False)

@app.route('/reels')
def reels():
    return render_template('reels.html', show_footer=True)

@app.route('/profile')
def profile():
    image_folder = os.path.join('static', 'images')
    image_files = [
        os.path.join(file)
        for file in os.listdir(image_folder)
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))
    ]
      # Debugging output
    print("Images sent to template:", image_files)
    return render_template('profile.html', images=image_files, show_footer=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
