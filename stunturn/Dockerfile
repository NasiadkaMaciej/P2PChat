FROM coturn/coturn:latest

USER root
RUN mkdir -p /etc/coturn
COPY stunturn/turnserver.conf /etc/coturn/turnserver.conf
RUN chmod 777 /etc/coturn/turnserver.conf
RUN chown nobody:nogroup /etc/coturn/turnserver.conf
USER nobody

EXPOSE 3478/tcp 3478/udp 49152-51800 49152-51800/udp


CMD ["turnserver", "-c", "/etc/coturn/turnserver.conf"]