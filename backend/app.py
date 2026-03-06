from flask import Flask
from flask_cors import CORS
import os

from utils.db import initialize_db, get_db
from routes.login_routes import init_login_blueprint
from blueprints.admin_bp import admin_bp
from blueprints.STAFF import staff_bp
from blueprints.patient import patient_bp
from blueprints.doctor import doctor_bp
from blueprints.appointment_routes import appointment_bp
from blueprints.pharmacy_model import stock_bp
from blueprints.prescriptions_bp import prescriptions_bp
from blueprints.chatbot import chatbot_db
from blueprints.staff_bp import doct_db
from blueprints.appointments_bp import appointments_bp
from blueprints.lab import lab_bp
from blueprints.machine.diseaseai import disease_bp
# from blueprints.machine.fetal_seg import 
from blueprints.machine.fetus_routes import fetus_bp
#Notify
from blueprints.notify import alerts_bp

app = Flask(__name__)
CORS(app)

# Secret key
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "your-secret-key-here")

# Initialize DB
initialize_db()
db = get_db().db

# Register blueprints
app.register_blueprint(init_login_blueprint(db, "super-secret-key"), url_prefix="/api")
app.register_blueprint(admin_bp)
app.register_blueprint(staff_bp)
app.register_blueprint(patient_bp, url_prefix="/mypatient")
app.register_blueprint(doctor_bp, url_prefix="/amdoctor")
app.register_blueprint(appointment_bp, url_prefix="/appointments")
app.register_blueprint(prescriptions_bp, url_prefix="/api")
app.register_blueprint(chatbot_db)
app.register_blueprint(doct_db)
app.register_blueprint(appointments_bp)
app.register_blueprint(lab_bp)
app.register_blueprint(disease_bp,url_prefix="/disease")
app.register_blueprint(fetus_bp,url_prefix="/machine")
app.register_blueprint(alerts_bp,url_prefix="/api")



app.register_blueprint(stock_bp)
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
