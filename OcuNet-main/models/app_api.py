import sys
import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename

# Ensure the parent directory is in the path to import from predict.py
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from predict import ImprovedMultiLabelClassifier

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'temp_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize the model globally so it's loaded once when the API starts
print("Loading OcuNet model...")
try:
    classifier = ImprovedMultiLabelClassifier(
        checkpoint_path=os.path.join(os.path.dirname(__file__), "ocunet_inference.pth" if os.path.exists(os.path.join(os.path.dirname(__file__), "ocunet_inference.pth")) else "ocunetv4.pth"),
        config_path=os.path.join(os.path.dirname(__file__), "..", "config", "config.yaml"),
        thresholds_path=os.path.join(os.path.dirname(__file__), "..", "evaluation_results", "optimal_thresholds.yaml"),
        calibration_path=os.path.join(os.path.dirname(__file__), "..", "evaluation_results", "calibration.yaml")
    )
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    classifier = None

@app.route('/predict', methods=['POST'])
def predict_eyes():
    if classifier is None:
        return jsonify({"error": "Model failed to load on the server."}), 500

    # Check if at least one image is in the request
    if 'left_eye' not in request.files and 'right_eye' not in request.files:
        return jsonify({"error": "Please provide at least one of 'left_eye' or 'right_eye' images in the form data."}), 400
    
    left_file = request.files.get('left_eye')
    right_file = request.files.get('right_eye')
    
    left_path = None
    right_path = None
    
    if left_file and left_file.filename != '':
        left_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(left_file.filename))
        left_file.save(left_path)
        
    if right_file and right_file.filename != '':
        right_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(right_file.filename))
        right_file.save(right_path)
        
    if not left_path and not right_path:
        return jsonify({"error": "No valid image files provided."}), 400
    
    try:
        left_result = {}
        right_result = {}
        
        if left_path:
            left_result = classifier.predict(left_path)
        if right_path:
            right_result = classifier.predict(right_path)
            
        # Prepare the response
        response = {
            "status": "success",
            "results": {
                "left_eye": {
                    "detected_diseases": left_result.get('detected_diseases', []),
                    "probabilities": left_result.get('probabilities', {})
                },
                "right_eye": {
                    "detected_diseases": right_result.get('detected_diseases', []),
                    "probabilities": right_result.get('probabilities', {})
                }
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500
        
    finally:
        # Clean up temporary files
        if left_path and os.path.exists(left_path):
            os.remove(left_path)
        if right_path and os.path.exists(right_path):
            os.remove(right_path)

if __name__ == '__main__':
    # Run the API on port 5000
    app.run(host='0.0.0.0', port=5000, debug=False)
