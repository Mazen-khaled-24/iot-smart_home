from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SensorReading(BaseModel):
    """Model for IoT sensor data from smart home devices."""
    
    t: float = Field(..., description="Temperature in Celsius")
    h: int = Field(..., ge=0, le=100, description="Humidity percentage")
    a: int = Field(..., ge=0, le=1023, description="Light sensor value (0-1023)")
    p: int = Field(..., description="Motion detected flag")
    timestamp: Optional[datetime] = Field(
        default_factory=datetime.now,
        description="Reading timestamp (auto-generated if not provided)"
    )


class SensorReadingResponse(BaseModel):
    """Response model including all sensor readings."""
    
    t: float
    h: int
    a: int
    p: bool
    timestamp: datetime
