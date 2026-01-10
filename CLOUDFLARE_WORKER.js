
/**
 * Cloudflare Worker Script for Telegram Bot API Proxy
 * 
 * 1. Go to https://workers.cloudflare.com/
 * 2. Create a new Worker
 * 3. Copy and paste this code
 * 4. Save and Deploy
 * 5. Use the worker URL in your .env: TELEGRAM_API_ROOT="https://your-worker.your-name.workers.dev"
 */

const upstream = 'api.telegram.org';
const upstream_path = '/';
const https = true;
 
addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request));
});
 
async function fetchAndApply(request) {
    const region = request.headers.get('cf-ipcountry').toUpperCase();
    const ip_address = request.headers.get('cf-connecting-ip');
    const user_agent = request.headers.get('user-agent');
 
    let response = null;
    let url = new URL(request.url);
    let url_host = url.host;
 
    if (https == true) {
        url.protocol = 'https:';
    } else {
        url.protocol = 'http:';
    }
 
    url.host = upstream;
 
    let method = request.method;
    let request_headers = request.headers;
    let new_request_headers = new Headers(request_headers);
 
    new_request_headers.set('Host', upstream);
    new_request_headers.set('Referer', url.href);
 
    let original_response = await fetch(url.href, {
        method: method,
        headers: new_request_headers,
        body: request.body
    });
 
    let response_headers = original_response.headers;
    let new_response_headers = new Headers(response_headers);
    let status = original_response.status;
 
    response = new Response(original_response.body, {
        status,
        headers: new_response_headers
    });
 
    return response;
}
