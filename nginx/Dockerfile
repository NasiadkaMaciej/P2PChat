FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration template
COPY conf/default.conf.template /etc/nginx/templates/default.conf.template

# ToDo: variables 
ENV DHT_DOMAIN=dht
ENV DHT_INTERNAL_PORT=3479
ENV STUN_DOMAIN=stun
ENV STUN_INTERNAL_PORT=3478

# Expose the port
EXPOSE ${EXTERNAL_PORT}