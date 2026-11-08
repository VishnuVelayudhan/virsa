FROM python:3.10-slim

# Set up user with UID 1000 as required by Hugging Face Spaces
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860

# Install system dependencies & Node.js 20 LTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    python3-dev \
    libgl1 \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR $HOME/app

# Install Python ML dependencies (using lightweight CPU wheels for PyTorch)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir flask werkzeug Pillow PyYAML numpy opencv-python-headless

# Copy package manifests and install Node.js dependencies
COPY --chown=user:user package*.json ./
RUN npm install --omit=dev

# Copy entire project
COPY --chown=user:user . .

# Ensure upload and temporary directories exist with full write permissions
RUN mkdir -p public/uploads OcuNet-main/models/temp_uploads && \
    chmod -R 777 public/uploads OcuNet-main/models/temp_uploads && \
    touch virsa.db && chmod 666 virsa.db

# Ensure start.sh has correct Linux line endings and executable permissions
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

USER user

EXPOSE 7860

CMD ["./start.sh"]
