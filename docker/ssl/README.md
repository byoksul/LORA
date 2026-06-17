# Production ortamı için boş SSL sertifikası yer tutucu
# Gerçek sertifikaları buraya koyun:
#   - fullchain.pem
#   - privkey.pem
#
# Let's Encrypt örneği:
#   certbot certonly --standalone -d yourdomain.com
#   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/
#   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/ssl/
