FROM node:20-alpine
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir --break-system-packages \
      numpy \
      pandas \
      matplotlib \
      scipy \
      requests \
      beautifulsoup4 \
      sympy
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
EXPOSE 3001
CMD ["node", "src/index.js"]
