# Use official lightweight Python image
FROM python:3.12.4

# Install system dependencies required for OpenCV
# ultralytics/opencv-python-headless needs libgl1-mesa-glx or similar
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create directory for results/weights if it doesn't exist and set permissions
RUN mkdir -p results/weights data dataset && \
    chmod -R 777 results data dataset

# Create a non-root user (Hugging Face Spaces requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose port 7860 (Hugging Face Spaces default)
ENV PORT=7860 \
    YOLO_CONFIG_DIR=/tmp/Ultralytics
EXPOSE 7860

# Run with Gunicorn on port 7860
CMD exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 0 app:app
