const publicCorsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3001",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function withPublicCorsHeaders(init?: ResponseInit): ResponseInit {
  return {
    ...init,
    headers: {
      ...publicCorsHeaders,
      ...(init?.headers ?? {}),
    },
  };
}

export function publicOptionsResponse() {
  return new Response(null, withPublicCorsHeaders({ status: 204 }));
}

