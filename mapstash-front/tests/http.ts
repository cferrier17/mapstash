export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })
}

export function textResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, init)
}
