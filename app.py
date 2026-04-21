"""
app.py — Flask backend for Weather Classifier
Serves predictions from the trained EfficientNet-B0 model.

Usage:
    python app.py

Endpoints:
    POST /predict   — accepts { image_base64: "<b64 string>" }
                      returns { label, confidence, top_predictions }
    GET  /health    — returns { status: "ok" }
"""

import os
import io
import base64
import json
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Config ────────────────────────────────────────────────────────────────────

CHECKPOINT_PATH = os.environ.get('CHECKPOINT_PATH', 'ml/checkpoints/best_checkpoint.pth')
PORT = int(os.environ.get('PORT', 5000))

CLASS_NAMES = ['dew', 'fog', 'frost', 'glaze', 'hail',
               'lightning', 'rain', 'rainbow', 'rime', 'sandstorm', 'snow']

NUM_CLASSES = len(CLASS_NAMES)

# ── Image preprocessing (must match training transforms) ──────────────────────

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# ── Model loading ─────────────────────────────────────────────────────────────

def load_model(checkpoint_path: str):
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
    nn.Dropout(p=0.3),
    nn.Linear(in_features, NUM_CLASSES),
)
    if os.path.exists(checkpoint_path):
        checkpoint = torch.load(checkpoint_path, map_location='cpu')
        # Support both raw state_dict and checkpoint dicts
        state_dict = checkpoint.get('model_state_dict', checkpoint)
        model.load_state_dict(state_dict)
        print(f'[INFO] Loaded checkpoint from {checkpoint_path}')
    else:
        print(f'[WARN] No checkpoint found at {checkpoint_path}. Using untrained model.')

    model.eval()
    return model


# ── App setup ─────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)  # allow requests from the React Native app

model = load_model(CHECKPOINT_PATH)


# ── Helpers ───────────────────────────────────────────────────────────────────

def preprocess_base64(b64_string: str) -> torch.Tensor:
    """Decode a base64 image string and return a model-ready tensor."""
    # Strip data URI prefix if present (e.g., "data:image/jpeg;base64,...")
    if ',' in b64_string:
        b64_string = b64_string.split(',', 1)[1]
    image_bytes = base64.b64decode(b64_string)
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    tensor = TRANSFORM(image).unsqueeze(0)  # shape: (1, 3, 224, 224)
    return tensor


def run_inference(tensor: torch.Tensor) -> dict:
    """Run the model and return label, confidence, and top-N predictions."""
    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]

    top_probs, top_indices = torch.topk(probabilities, k=NUM_CLASSES)

    top_predictions = [
        {
            'label': CLASS_NAMES[idx.item()],
            'confidence': round(prob.item(), 4),
        }
        for prob, idx in zip(top_probs, top_indices)
    ]

    return {
        'label': top_predictions[0]['label'],
        'confidence': top_predictions[0]['confidence'],
        'top_predictions': top_predictions,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'classes': CLASS_NAMES})


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)

    if not data:
        return jsonify({'error': 'No JSON body received'}), 400

    # Accept image_base64 field
    b64 = data.get('image_base64')
    if not b64:
        return jsonify({'error': 'Missing image_base64 field'}), 400

    try:
        tensor = preprocess_base64(b64)
    except Exception as e:
        return jsonify({'error': f'Image decoding failed: {str(e)}'}), 400

    try:
        result = run_inference(tensor)
    except Exception as e:
        return jsonify({'error': f'Inference failed: {str(e)}'}), 500

    return jsonify(result)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print(f'[INFO] Starting Weather Classifier API on port {PORT}')
    print(f'[INFO] Classes: {CLASS_NAMES}')
    app.run(host='0.0.0.0', port=PORT, debug=False)