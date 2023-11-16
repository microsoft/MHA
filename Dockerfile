FROM node:latest@sha256:bc56c8da9f3e892e2697e37db775c42c52abee85c6c035f21587fa509be76d76

WORKDIR /app

RUN git clone https://github.com/stephenegriffin/MHA.git
RUN cd /app/MHA && npm i && npm run build --if-present