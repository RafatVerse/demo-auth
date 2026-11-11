export interface BrandInfo {
  name: string;
  color: string;
  textColor: string;
  tag: string;
}

export function getBrandMeta(issuer: string = ''): BrandInfo {
  const norm = issuer.toLowerCase().trim();

  if (norm.includes('google') || norm.includes('gmail')) {
    return { name: 'Google', color: '#4285F4', textColor: '#ffffff', tag: 'G' };
  }
  if (norm.includes('github')) {
    return { name: 'GitHub', color: '#24292e', textColor: '#ffffff', tag: 'GH' };
  }
  if (norm.includes('discord')) {
    return { name: 'Discord', color: '#5865F2', textColor: '#ffffff', tag: 'DC' };
  }
  if (norm.includes('microsoft') || norm.includes('azure') || norm.includes('outlook')) {
    return { name: 'Microsoft', color: '#00A4EF', textColor: '#ffffff', tag: 'MS' };
  }
  if (norm.includes('amazon') || norm.includes('aws')) {
    return { name: 'Amazon', color: '#FF9900', textColor: '#000000', tag: 'AWS' };
  }
  if (norm.includes('steam')) {
    return { name: 'Steam', color: '#171a21', textColor: '#ffffff', tag: 'ST' };
  }
  if (norm.includes('apple') || norm.includes('icloud')) {
    return { name: 'Apple', color: '#000000', textColor: '#ffffff', tag: 'AP' };
  }
  if (norm.includes('binance') || norm.includes('crypto')) {
    return { name: 'Binance', color: '#F3BA2F', textColor: '#000000', tag: 'BN' };
  }
  if (norm.includes('twitter') || norm.includes(' x ') || norm === 'x') {
    return { name: 'X', color: '#000000', textColor: '#ffffff', tag: 'X' };
  }
  if (norm.includes('facebook') || norm.includes('meta')) {
    return { name: 'Facebook', color: '#1877F2', textColor: '#ffffff', tag: 'FB' };
  }
  if (norm.includes('cloudflare')) {
    return { name: 'Cloudflare', color: '#F38020', textColor: '#ffffff', tag: 'CF' };
  }
  if (norm.includes('slack')) {
    return { name: 'Slack', color: '#4A154B', textColor: '#ffffff', tag: 'SL' };
  }
  if (norm.includes('gitlab')) {
    return { name: 'GitLab', color: '#FC6D26', textColor: '#ffffff', tag: 'GL' };
  }
  if (norm.includes('proton')) {
    return { name: 'Proton', color: '#6D4AFF', textColor: '#ffffff', tag: 'PR' };
  }
  if (norm.includes('dropbox')) {
    return { name: 'Dropbox', color: '#0061FF', textColor: '#ffffff', tag: 'DB' };
  }
  if (norm.includes('vesdi')) {
    return { name: 'VESDI', color: '#FF6B00', textColor: '#ffffff', tag: 'V' };
  }

  // Fallback: derive initial 1 or 2 letters
  const clean = issuer.trim().toUpperCase() || 'AUTH';
  const tag = clean.slice(0, 2);
  // deterministic color based on hash of string
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [210, 160, 280, 340, 25, 45, 195];
  const selectedHue = hues[Math.abs(hash) % hues.length];
  const color = `hsl(${selectedHue}, 70%, 45%)`;

  return {
    name: issuer || 'Service',
    color,
    textColor: '#ffffff',
    tag,
  };
}
