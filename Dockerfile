# Use nginx alpine as a lightweight web server
FROM nginx:alpine

# Copy static files to nginx html directory
COPY index.html styles.css app.js jq.js jq.wasm /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]