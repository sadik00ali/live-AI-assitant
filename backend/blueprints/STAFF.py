# app.py (Flask Backend)
from flask import Flask, request, Blueprint,jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
from datetime import datetime
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

staff_bp = Blueprint("staff", __name__)
# CORS(staff_bp)  # Enable CORS for all routes

# Configuration
ORIGINAL_DATA_PATH = r"backend\blueprints\hospital_admissions.csv"
FEATURED_DATA_PATH = r"backend\blueprints\hospital_admissions_featured.csv"
MODEL_PATHS = {
    'admissions': r"backend\blueprints\sarimax_admissions_model.joblib",
    'beds': r"backend\blueprints\sarimax_beds_model.joblib",
    'staff': r"backend\blueprints\sarimax_staff_model.joblib"
}


def create_featured_dataset():
    """
    Creates the featured dataset if it doesn't exist
    """
    try:
        if os.path.exists(FEATURED_DATA_PATH):
            return True
            
        print(f"Creating featured dataset from '{ORIGINAL_DATA_PATH}'...")
        df = pd.read_csv(ORIGINAL_DATA_PATH, parse_dates=['date'])

        # Add features
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['year'] = df['date'].dt.year
        df['is_weekend'] = (df['date'].dt.dayofweek >= 5).astype(int)

        # Add realistic resource estimates
        df['estimated_beds_needed'] = (df['NO_OF_ADMISSIONS'] * 0.70).round().astype(int)
        df['estimated_staff_needed'] = (df['NO_OF_ADMISSIONS'] / 4).round().astype(int)

        df.to_csv(FEATURED_DATA_PATH, index=False)
        print(f"Featured dataset saved to '{FEATURED_DATA_PATH}'")
        return True

    except FileNotFoundError:
        print(f"Error: The original data file '{ORIGINAL_DATA_PATH}' was not found.")
        return False
    except Exception as e:
        print(f"An error occurred while creating the featured dataset: {e}")
        return False

def load_models():
    """
    Load all trained models
    """
    models = {}
    for model_name, model_path in MODEL_PATHS.items():
        if not os.path.exists(model_path):
            print(f"Model file '{model_path}' not found.")
            return None
        try:
            models[model_name] = joblib.load(model_path)
        except Exception as e:
            print(f"Error loading model '{model_path}': {e}")
            return None
    return models

def get_future_exog(target_date_str):
    """
    Generate exogenous variables for future dates
    """
    try:
        # Load data to get the last date
        df = pd.read_csv(FEATURED_DATA_PATH, parse_dates=['date'])
        last_date = df['date'].max()
        
        target_date = pd.to_datetime(target_date_str)
        days_to_forecast = (target_date - last_date).days
        
        if days_to_forecast <= 0:
            return None, "Please provide a future date."
        
        # Generate future dates and exogenous variables
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=days_to_forecast)
        future_exog = pd.DataFrame(index=future_dates)
        future_exog['day_of_week'] = future_exog.index.dayofweek
        future_exog['month'] = future_exog.index.month
        future_exog['year'] = future_exog.index.year
        future_exog['is_weekend'] = (future_exog.index.dayofweek >= 5).astype(int)
        
        return future_exog, None
    except Exception as e:
        return None, f"Error generating future exogenous variables: {e}"

@staff_bp.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({"status": "healthy", "message": "Hospital prediction API is running"})

@staff_bp.route('/api/predict', methods=['GET'])
def predict():
    """
    Predict resources for a given date
    """
    date_str = request.args.get('date')
    
    if not date_str:
        return jsonify({"error": "Date parameter is required"}), 400
    
    try:
        # Validate date format
        target_date = datetime.strptime(date_str, '%Y-%m-%d')
        if target_date.date() <= datetime.now().date():
            return jsonify({"error": "Please provide a future date"}), 400
    except ValueError:
        return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD"}), 400
    
    # Ensure featured dataset exists
    if not create_featured_dataset():
        return jsonify({"error": "Failed to create featured dataset"}), 500
    
    # Load models
    models = load_models()
    if not models:
        return jsonify({"error": "Models not found. Please train the models first"}), 500
    
    # Generate future exogenous variables
    future_exog, error = get_future_exog(date_str)
    if error:
        return jsonify({"error": error}), 400
    
    # Make predictions
    predictions = {}
    for model_name, model in models.items():
        try:
            forecast = model.get_forecast(steps=len(future_exog), exog=future_exog)
            prediction = int(round(forecast.predicted_mean.iloc[-1]))
            predictions[model_name] = prediction
        except Exception as e:
            return jsonify({"error": f"Prediction error for {model_name}: {str(e)}"}), 500
    
    # Format response
    formatted_date = target_date.strftime('%d %B %Y')
    return jsonify({
        "date": formatted_date,
        "predicted_patients": predictions['admissions'],
        "predicted_beds_needed": predictions['beds'],
        "predicted_staff_needed": predictions['staff']
    })

@staff_bp.route('/api/models/retrain', methods=['POST'])
def retrain_models():
    """
    Retrain all models
    """
    try:
        # Ensure featured dataset exists
        if not create_featured_dataset():
            return jsonify({"error": "Failed to create featured dataset"}), 500
        
        # Load data
        df = pd.read_csv(FEATURED_DATA_PATH, parse_dates=['date'], index_col='date')
        
        # Define targets and exogenous features
        targets = {
            'admissions': 'NO_OF_ADMISSIONS',
            'beds': 'estimated_beds_needed',
            'staff': 'estimated_staff_needed'
        }
        
        exog_features = ['day_of_week', 'month', 'year', 'is_weekend']
        exog = df[exog_features]
        
        # Train models
        from statsmodels.tsa.statespace.sarimax import SARIMAX
        
        for model_name, target_col in targets.items():
            print(f"Training model for: {target_col}")
            endog = df[target_col]
            
            model = SARIMAX(endog,
                            exog=exog,
                            order=(1, 1, 1),
                            seasonal_order=(1, 1, 1, 7))
            
            model_fit = model.fit(disp=False)
            
            # Save model
            model_path = MODEL_PATHS[model_name]
            joblib.dump(model_fit, model_path)
            print(f"Model saved to '{model_path}'")
        
        return jsonify({"message": "Models retrained successfully"})
    
    except Exception as e:
        return jsonify({"error": f"Error retraining models: {str(e)}"}), 500

@staff_bp.route('/api/data/features', methods=['GET'])
def get_featured_data():
    """
    Get the featured dataset (for visualization)
    """
    try:
        if not os.path.exists(FEATURED_DATA_PATH):
            if not create_featured_dataset():
                return jsonify({"error": "Failed to create featured dataset"}), 500
        
        df = pd.read_csv(FEATURED_DATA_PATH)
        # Convert to list of records for JSON serialization
        data = df.to_dict('records')
        
        return jsonify({
            "data": data,
            "count": len(data)
        })
    except Exception as e:
        return jsonify({"error": f"Error loading data: {str(e)}"}), 500

@staff_bp.route('/api/models/performance', methods=['GET'])
def get_model_performance():
    """
    Get model performance metrics
    """
    try:
        if not os.path.exists(FEATURED_DATA_PATH):
            return jsonify({"error": "Featured dataset not found"}), 404
        
        df = pd.read_csv(FEATURED_DATA_PATH, parse_dates=['date'], index_col='date')
        
        # Define targets and exogenous features
        targets = {
            'admissions': 'NO_OF_ADMISSIONS',
            'beds': 'estimated_beds_needed',
            'staff': 'estimated_staff_needed'
        }
        
        exog_features = ['day_of_week', 'month', 'year', 'is_weekend']
        exog = df[exog_features]
        
        from sklearn.metrics import mean_absolute_error, mean_squared_error
        import numpy as np
        
        performance = {}
        
        for model_name, target_col in targets.items():
            model_path = MODEL_PATHS[model_name]
            if not os.path.exists(model_path):
                performance[model_name] = {"error": "Model not found"}
                continue
            
            # Load model
            model = joblib.load(model_path)
            
            # Split data for evaluation
            endog = df[target_col]
            split_point = int(len(endog) * 0.8)
            train_endog, test_endog = endog[:split_point], endog[split_point:]
            train_exog, test_exog = exog[:split_point], exog[split_point:]
            
            # Make predictions
            predictions = model.get_forecast(steps=len(test_endog), exog=test_exog).predicted_mean
            
            # Calculate metrics
            mae = mean_absolute_error(test_endog, predictions)
            mse = mean_squared_error(test_endog, predictions)
            rmse = np.sqrt(mse)
            
            performance[model_name] = {
                "mae": round(mae, 2),
                "mse": round(mse, 2),
                "rmse": round(rmse, 2)
            }
        
        return jsonify(performance)
    
    except Exception as e:
        return jsonify({"error": f"Error calculating performance: {str(e)}"}), 500
