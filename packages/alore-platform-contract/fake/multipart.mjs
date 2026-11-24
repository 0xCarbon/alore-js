// Minimal multipart/form-data reader for the fake. It reads what the contract's multipart routes
// send (text fields and file parts); it is not a general parser.

/** `{ fields, files }` from a body Buffer and its Content-Type; throws Error on a malformed body. */
export function parseMultipart(buffer, contentType) {
  const boundary = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType ?? '');
  if (!boundary) throw new Error('multipart body has no boundary');
  const delimiter = Buffer.from(`--${boundary[1] ?? boundary[2]}`);
  const fields = {};
  const files = [];
  let at = buffer.indexOf(delimiter);
  if (at < 0) throw new Error('multipart body has no parts');
  for (;;) {
    at += delimiter.length;
    if (buffer.subarray(at, at + 2).toString('latin1') === '--') return { fields, files };
    if (buffer.subarray(at, at + 2).toString('latin1') !== '\r\n')
      throw new Error('malformed multipart delimiter');
    at += 2;
    const headEnd = buffer.indexOf('\r\n\r\n', at);
    const next = buffer.indexOf(Buffer.concat([Buffer.from('\r\n'), delimiter]), at);
    if (headEnd < 0 || next < 0) throw new Error('multipart part is not terminated');
    const head = buffer.subarray(at, headEnd).toString('utf8');
    const data = buffer.subarray(headEnd + 4, next);
    const disposition = /^content-disposition:\s*form-data;(.*)$/im.exec(head);
    const name = /\bname="([^"]*)"/.exec(disposition?.[1] ?? '')?.[1];
    if (name === undefined) throw new Error('multipart part has no name');
    const filename = /\bfilename="([^"]*)"/.exec(disposition[1])?.[1];
    if (filename === undefined) fields[name] = data.toString('utf8');
    else {
      const type = /^content-type:\s*(.+)$/im.exec(head)?.[1]?.trim() ?? 'application/octet-stream';
      files.push({ name, filename, contentType: type, data: Buffer.from(data) });
    }
    at = next + 2; // past the CRLF, onto the delimiter
  }
}

// OpenAPI represents binary parts as strings. Only a file part can supply the required binary field.
export const multipartRequestObject = (form, binaryField) => ({
  ...Object.fromEntries(
    Object.entries(form.fields).filter(([name]) => name !== binaryField && !name.includes('[')),
  ),
  ...Object.fromEntries(form.files.map((f) => [f.name, f.filename])),
});
