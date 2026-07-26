import dns from 'dns/promises';
import { interpolateString, interpolateObject } from '../../utils/interpolation.js';

const isInternalIP = (ip) => {
  if (ip === '::1') return true;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const p1 = parseInt(parts[0], 10);
  const p2 = parseInt(parts[1], 10);
  if (p1 === 127 || p1 === 10) return true;
  if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;
  if (p1 === 192 && p2 === 168) return true;
  if (p1 === 169 && p2 === 254) return true;
  return false;
};

export const execute = async (node, ctx) => {
  const method = node.data.method || 'GET';
  const url = interpolateString(node.data.url, ctx);
  const headers = interpolateObject(node.data.headers || {}, ctx);
  const body = interpolateObject(node.data.body, ctx);
  
  if (!url) {
    throw new Error('HTTP Action requires a valid URL');
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.toLowerCase() === 'localhost') throw new Error('Loopback blocked');
    const { address } = await dns.lookup(parsedUrl.hostname);
    if (isInternalIP(address)) {
      throw new Error('Internal IP blocked');
    }
  } catch (err) {
    throw new Error(`SSRF Blocked: URL resolved to a restricted internal network address or is invalid.`);
  }

  console.log(`[Node: ${node.id}] Executing HTTP Request to ${url}`);
  
  const options = {
    method: method.toUpperCase(),
    headers: { 'Content-Type': 'application/json', ...headers }
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
    options.body = typeof body === 'object' ? JSON.stringify(body) : body;
  }
  
  try {
    // Basic timeout implementation using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
    
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    
    const responseText = await response.text();
    let json = null;
    try { json = JSON.parse(responseText); } catch (e) {}

    return {
      status: response.status,
      data: json || responseText
    };
  } catch (error) {
    throw new Error(`HTTP Request Failed: ${error.message}`);
  }
};
