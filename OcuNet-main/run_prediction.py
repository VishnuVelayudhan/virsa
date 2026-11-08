import sys; import os; sys.path.insert(0, os.path.abspath('.')); 
from predict import ImprovedMultiLabelClassifier # Note: you might need to adjust the import based on your exact folder structure

# Initialize the model with the downloaded weights
classifier = ImprovedMultiLabelClassifier(
    checkpoint_path="models/ocunetv4.pth",  # This points to the file you just downloaded
    config_path="config/config.yaml"        # Make sure this points to your config file
)

# Run Inference on any eye picture you have
result = classifier.predict("path/to/your/retinal_image.jpg")

# Print detected diseases
print(f"Detected: {result['detected_diseases']}")
for disease, prob in result['probabilities'].items():
    print(f"{disease}: {prob:.2%}")
