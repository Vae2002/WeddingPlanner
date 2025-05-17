from flask import Flask, render_template, url_for
from datetime import datetime
import os


app = Flask(__name__)

@app.context_processor
def inject_year():
    return {'current_year': datetime.now().year}

@app.route('/')
def home():
    return render_template('home.html', show_footer=True)

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

@app.route('/capture')
def capture():
    return render_template('capture.html', show_footer=False)

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
    return render_template('profile.html', show_footer=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
