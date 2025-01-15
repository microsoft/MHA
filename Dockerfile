FROM node:latest@sha256:79daa9914f64d084477d704b32ab6143190d21c43b4f4ae5410bac7a491e07ae

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm ci && npm run build --if-present
