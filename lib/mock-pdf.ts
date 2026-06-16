/** Minimal valid PDF returned when pdflatex is unavailable. */
export function createMockPdf(): Buffer {
  const text = "Install pdflatex to enable PDF preview.";
  const stream = `BT /F1 11 Tf 72 720 Td (${text}) Tj ET`;
  const streamLen = stream.length;

  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${streamLen}>>stream
${stream}
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000264 00000 n 
0000000380 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
456
%%EOF`;

  return Buffer.from(pdf, "utf-8");
}
