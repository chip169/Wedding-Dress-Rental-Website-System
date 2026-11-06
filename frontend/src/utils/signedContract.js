export function savedContractUrl(value, baseUrl = 'http://localhost') {
  if (typeof value !== 'string' || !value.trim()) return null;
  const url = value.trim();
  if (!/^(https?:\/\/|\/(?!\/))/.test(url)) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(url)) return null;
  try {
    const parsed = new URL(url, new URL(baseUrl, globalThis.location?.origin || 'http://localhost'));
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    // A template preview is not a copy of a customer's signed contract.
    if (/\/contract-templates(?:\/|$)/i.test(parsed.pathname)) return null;
    return url.startsWith('/') && baseUrl !== 'http://localhost' ? parsed.href : url;
  } catch {
    return null;
  }
}

export function getSignedContract(order) {
  const contract = order?.contract;
  const signature = typeof order?.contractSignature === 'string' ? order.contractSignature.trim() : '';
  const pendingSignature = contract?.status === 'pending_signature' && !contract.signedAt;
  const fileUrl = savedContractUrl(contract?.contractPdfUrl);
  const clauses = Array.isArray(contract?.clauses)
    ? contract.clauses.filter((clause) => clause && (clause.title || clause.content))
    : [];
  return {
    code: contract?.contractCode || order?.contractCode || '',
    name: contract?.templateName || '',
    signedAt: contract?.signedAt || null,
    signedMethod: contract?.signedMethod || '',
    signature,
    signatureIsImage: /^data:image\/(png|jpeg|webp);base64,/.test(signature),
    pendingSignature,
    hasRecord: Boolean(contract || order?.contractCode || signature),
    hasDocument: !pendingSignature && Boolean(fileUrl || clauses.length),
    fileUrl: pendingSignature ? null : fileUrl,
    clauses: pendingSignature ? [] : clauses,
  };
}
