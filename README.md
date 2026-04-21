# Weather Classifier Application

A mobile + web app that classifies weather conditions from images using a fine-tuned EfficientNet-B0 model trained on 6,862 images across 11 weather classes.

**Team:** Theo Boateng, Alex Castillo, Anthony Washington — Group 68, UConn CSE 4830

**Test Accuracy: 93.68%**

---

## Detectable Weather Conditions
Dew · Fog · Frost · Glaze · Hail · Lightning · Rain · Rainbow · Rime · Sandstorm · Snow

---

## Requirements

- Python 3.8+
- Node.js 18+
- npm

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/TheoKB3/WeatherClassifierApplication.git
cd WeatherClassifierApplication
```

### 2. Install Python dependencies

```bash
pip install torch torchvision flask flask-cors Pillow numpy scikit-learn matplotlib seaborn
```

### 3. Train the model (skip if you already have the checkpoint)

Download the dataset from Kaggle:
```
https://www.kaggle.com/datasets/jehanbhathena/weather-dataset
```

Unzip it into the project folder, then split it:
```bash
python split_dataset.py --source ./dataset --dest ./data
```

Train the model:
```bash
python train_model.py --data_dir ./data --epochs 30
```

This saves the trained model to `ml/checkpoints/best_checkpoint.pth`.

### 4. Start the Flask backend

```bash
python app.py
```

You should see:
```
[INFO] Loaded checkpoint from ml/checkpoints/best_checkpoint.pth
[INFO] Starting Weather Classifier API on port 5000
* Running on http://127.0.0.1:5000
```

Keep this running in the background.

### 5. Install frontend dependencies

```bash
cd WeatherClassifierApp
npm install
npx expo install expo-camera expo-image-picker expo-media-library expo-file-system react-dom react-native-web @expo/metro-runtime
```

### 6. Run the app

**In your browser (recommended for demo):**
```bash
npx expo start --clear
```
Then press **W** to open in your browser.

**On your phone (iOS or Android):**
- Install Expo Go from the App Store or Play Store
- Make sure your phone and laptop are on the same WiFi
- Run `npx expo start --clear --host lan`
- Scan the QR code with your iPhone Camera app or Expo Go

---

## How to Use

1. Open the app — tap through the onboarding screens
2. On the Home screen, tap **Use Camera** or **Upload a Photo**
3. Take or select a photo of a weather condition
4. Tap **Analyze Weather**
5. View the predicted condition, confidence score, and full probability breakdown

---

## Project Structure

```
WeatherClassifierApplication/
├── WeatherClassifierApp/         # React Native frontend
│   ├── screens/
│   │   ├── StartScreen.js        # Onboarding
│   │   ├── HomeScreen.js         # Main menu
│   │   ├── CameraScreen.js       # Camera capture
│   │   ├── UploadScreen.js       # Image upload
│   │   └── ResultsScreen.js      # Classification results
│   ├── App.js                    # Navigation setup
│   └── index.js                  # Entry point
├── app.py                        # Flask API server
├── train_model.py                # Model training script
├── evaluate.py                   # Model evaluation script
├── split_dataset.py              # Dataset splitter
└── ml/
    ├── checkpoints/              # Saved model checkpoints
    ├── exports/                  # Exported model files
    └── results/                  # Training curves, confusion matrix
```

---

## Model Details

- **Architecture:** EfficientNet-B0 (pretrained on ImageNet, fine-tuned)
- **Dataset:** 6,862 images, 11 classes
- **Split:** 80% train / 10% val / 10% test
- **Test Accuracy:** 93.68%
- **Training:** AdamW optimizer, cosine LR scheduler, label smoothing

---

## Notes

- The Flask server must be running before using the app
- When running on a phone, update `127.0.0.1` to your laptop's local IP in `ResultsScreen.js`
- The `data/` and `dataset/` folders are not included in the repo due to size — download from Kaggle