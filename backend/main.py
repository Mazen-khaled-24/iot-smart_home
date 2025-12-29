from datetime import datetime
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import SensorReading, SensorReadingResponse

app = FastAPI(
    title="IoT Smart Home API",
    description="API for receiving and serving sensor readings from smart home devices",
    version="1.0.0"
)

# CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for sensor readings
sensor_history: List[SensorReading] = []
MAX_HISTORY = 100  # Keep last 100 readings


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "online", "service": "IoT Smart Home API"}


@app.post("/sensor-data", response_model=SensorReadingResponse)
def receive_sensor_data(reading: SensorReading):
    """
    Receive sensor data from IoT devices.
    
    - **temp**: Temperature in Celsius
    - **humidity**: Humidity percentage (0-100)
    - **ldr**: Light sensor raw value (0-1023)
    - **motion**: Boolean indicating motion detection
    """
    # Ensure timestamp is set
    if reading.timestamp is None:
        reading.timestamp = datetime.now()
    
    if reading.p == 1:
        reading.p = True
    else:
        reading.p = False
    
    # Store in history
    sensor_history.append(reading)
    
    # Trim history if needed
    if len(sensor_history) > MAX_HISTORY:
        sensor_history.pop(0)
    
    return reading


@app.get("/sensor-data", response_model=SensorReadingResponse)
def get_latest_sensor_data():
    """Get the most recent sensor reading."""
    if not sensor_history:
        # Return default values if no data yet
        return SensorReadingResponse(
            t=0.0,
            h=0,
            a=0,
            p=False,
            timestamp=datetime.now()
        )
    return sensor_history[-1]


@app.get("/sensor-data/history", response_model=List[SensorReadingResponse])
def get_sensor_history(limit: int = 10):
    """
    Get historical sensor readings.
    
    - **limit**: Number of readings to return (default: 10, max: 100)
    """
    limit = min(limit, MAX_HISTORY)
    return sensor_history[-limit:]
