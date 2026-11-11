/**
 * Reads a request body as bytes, holding at most `maxBytes` of it. Returns
 * `null` without reading when the declared `contentLength` is already over
 * the cap, and cancels the stream the moment a chunked body crosses it, so a
 * route can never be made to buffer more than `maxBytes` plus one chunk.
 *
 * @param body the request's body stream (`req.body`); `null` reads as empty
 * @param contentLength the `content-length` header, or `null` when absent
 * @param maxBytes the largest body accepted, in bytes
 */
export async function readBodyWithCap(
  body: ReadableStream<Uint8Array> | null,
  contentLength: string | null,
  maxBytes: number
): Promise<Uint8Array<ArrayBuffer> | null> {
  if (contentLength !== null && Number(contentLength) > maxBytes) return null;
  if (!body) return new Uint8Array(0);

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
