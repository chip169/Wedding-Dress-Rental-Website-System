import axiosClient from '../api/axiosClient';
import card1 from '../assets/card1_elysian.jpg';
import card2 from '../assets/card2_celeste.jpg';
import card3 from '../assets/card3_lumiere.jpg';
import card4 from '../assets/card4_monet.jpg';
import card5 from '../assets/card5_aurora.jpg';
import card6 from '../assets/card6_seraphina.jpg';
import card7 from '../assets/card7_vivienne.jpg';
import card8 from '../assets/card8_juliette.jpg';
import card9 from '../assets/card9_genevieve.jpg';

const localImages = { 1: card1, 2: card2, 3: card3, 4: card4, 5: card5, 6: card6, 7: card7, 8: card8, 9: card9 };

export function dressImage(dress) {
  const raw = dress.image || dress.images?.[0] || '';
  if (/^https?:\/\//.test(raw) || /^data:image\//.test(raw)) return raw;
  const card = raw.match(/card(\d+)_dress/)?.[1];
  return localImages[card] || raw;
}

export const getDressesFromApi = async () => (await axiosClient.get('/dresses')).data.map((dress) => ({ ...dress, id: String(dress._id), image: dressImage(dress) }));
