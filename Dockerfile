FROM node:latest@sha256:914458d8617650599ec2c05f6754403a1ce08cb471b0b1de1de439c539f8d45f

WORKDIR /app

RUN git clone https://github.com/microsoft/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present
