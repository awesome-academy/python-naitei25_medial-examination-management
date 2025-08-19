from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import numpy as np
import json
import os
import re
import unicodedata
from collections import defaultdict

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load models
model = None
label_encoder = None
symptom_mapping = None
disease_mapping = None
symptom_keys_ordered = None
symptom_norm_to_key = None
token_to_symptoms = None
SUGGEST_STOPWORDS = {
    'and','or','the','a','an','of','in','on','with','without','to','for','due','during','after','before',
    'pain','symptom','symptoms','area','region','chronic','acute','abnormal','movement','movements','body'
}

def load_models():
    global model, label_encoder, symptom_mapping, disease_mapping, symptom_keys_ordered, symptom_norm_to_key, token_to_symptoms
    
    try:
        # Load trained model
        model = joblib.load('models/random_forest_model.joblib')
        label_encoder = joblib.load('models/label_encoder.joblib')
        
        # Load mappings
        with open('data_info/symptom_mapping.json', 'r', encoding='utf-8') as f:
            symptom_mapping = json.load(f)
        
        with open('data_info/disease_mapping.json', 'r', encoding='utf-8') as f:
            disease_mapping = json.load(f)
            
        # Precompute helpers
        symptom_keys_ordered = list(symptom_mapping.keys())
        symptom_norm_to_key = {}
        token_to_symptoms = defaultdict(set)
        for en_key, vn_value in symptom_mapping.items():
            en_norm = _normalize_text(en_key)
            vn_norm = _normalize_text(vn_value)
            symptom_norm_to_key[en_norm] = en_key
            symptom_norm_to_key[vn_norm] = en_key
            for tok in _tokens(en_norm):
                if tok and tok not in SUGGEST_STOPWORDS:
                    token_to_symptoms[tok].add(en_key)
            for tok in _tokens(vn_norm):
                if tok and tok not in SUGGEST_STOPWORDS:
                    token_to_symptoms[tok].add(en_key)

        print("Models loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

@app.route('/')
def home():
    return render_template('index.html', symptoms=symptom_mapping)

@app.route('/chat')
def chat_page():
    return render_template('chat.html', symptoms=symptom_mapping)

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        
        if not symptoms:
            return jsonify({'error': 'No symptoms provided'}), 400
        
        # Create feature vector (assuming binary encoding for symptoms)
        # You might need to adjust this based on how your model was trained
        feature_vector = np.zeros(len(symptom_mapping))
        
        for symptom in symptoms:
            if symptom in symptom_mapping:
                # Find the index of the symptom
                try:
                    idx = symptom_keys_ordered.index(symptom)
                    feature_vector[idx] = 1
                except ValueError:
                    continue
        
        # Reshape for prediction
        feature_vector = feature_vector.reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(feature_vector)
        predicted_disease = label_encoder.inverse_transform(prediction)[0]
        
        # Get Vietnamese name
        disease_vn = disease_mapping.get(predicted_disease, predicted_disease)
        
        # Get prediction probabilities
        probabilities = model.predict_proba(feature_vector)[0]
        top_indices = np.argsort(probabilities)[::-1][:5]  # Top 5 predictions
        
        # Map probability indices to actual encoded class labels
        model_classes = getattr(model, 'classes_', None)
        if model_classes is None:
            return jsonify({'error': 'Model does not expose classes_ for predict_proba mapping'}), 500
        
        top_predictions = []
        for prob_index in top_indices:
            encoded_label = model_classes[prob_index]
            disease_name = label_encoder.inverse_transform([encoded_label])[0]
            disease_vn_name = disease_mapping.get(disease_name, disease_name)
            top_predictions.append({
                'disease': disease_name,
                'disease_vn': disease_vn_name,
                'probability': float(probabilities[prob_index])
            })
        
        return jsonify({
            'predicted_disease': predicted_disease,
            'predicted_disease_vn': disease_vn,
            'confidence': float(max(probabilities)),
            'top_predictions': top_predictions,
            'input_symptoms': symptoms
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _normalize_text(text: str) -> str:
    text = text.lower()
    text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    # Keep letters/digits/spaces only
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def _tokens(normalized_text: str):
    if not normalized_text:
        return []
    return [t for t in normalized_text.split(' ') if t]

def _extract_symptoms_from_text(text: str):
    """Extract symptom keys (EN) from free text in EN or VN.
    Uses simple normalized substring matching against both EN keys and VN values.
    """
    if not text:
        return []
    normalized = _normalize_text(text)
    found_keys = set()

    # Try longest phrases first to avoid partial shadowing
    phrases = sorted(symptom_norm_to_key.keys(), key=len, reverse=True)
    for phrase in phrases:
        if not phrase:
            continue
        # word-boundary like match; phrase may have spaces
        # Build regex safely
        pattern = r'(?<![a-z0-9])' + re.escape(phrase) + r'(?![a-z0-9])'
        if re.search(pattern, normalized):
            found_keys.add(symptom_norm_to_key[phrase])

    return list(found_keys)

def _suggest_related_symptoms(chosen_keys, limit=8):
    if not chosen_keys:
        return []
    # Score candidates by shared tokens frequency
    token_set = set()
    for key in chosen_keys:
        token_set.update(_tokens(_normalize_text(key)))
        token_set.update(_tokens(_normalize_text(symptom_mapping.get(key, ''))))
    scores = {}
    for tok in list(token_set):
        if tok in SUGGEST_STOPWORDS:
            continue
        for cand in token_to_symptoms.get(tok, []):
            if cand in chosen_keys:
                continue
            scores[cand] = scores.get(cand, 0) + 1
    ranked = sorted(scores.items(), key=lambda x: (-x[1], x[0]))
    return [name for name, _ in ranked[:limit]]

@app.route('/api/parse-symptoms', methods=['POST'])
def parse_symptoms():
    try:
        data = request.get_json() or {}
        text = data.get('text', '')
        chosen = data.get('chosen', [])
        matched = _extract_symptoms_from_text(text)
        suggestion_basis = list(set(chosen) | set(matched))
        suggestions = _suggest_related_symptoms(suggestion_basis)
        return jsonify({
            'matched_symptoms': matched,
            'matched_symptoms_vn': [symptom_mapping[k] for k in matched],
            'suggestions': suggestions,
            'suggestions_vn': [symptom_mapping.get(k, k) for k in suggestions]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/symptoms', methods=['GET'])
def get_symptoms():
    """Get all available symptoms"""
    try:
        return jsonify({
            'symptoms': list(symptom_mapping.keys()),
            'symptoms_vn': list(symptom_mapping.values())
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/diseases', methods=['GET'])
def get_diseases():
    """Get all available diseases"""
    try:
        return jsonify({
            'diseases': list(disease_mapping.keys()),
            'diseases_vn': list(disease_mapping.values())
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    if load_models():
        app.run(debug=True, host='0.0.0.0', port=5001)
    else:
        print("Failed to load models. Please check your model files.")
