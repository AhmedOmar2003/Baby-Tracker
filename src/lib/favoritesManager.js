const STORAGE_KEY = 'bt_favorites';

const loadFavorites = () => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

const saveFavorites = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getFavorites = (category = null) => {
  const favorites = loadFavorites();
  if (category) {
    return favorites[category] || [];
  }
  return favorites;
};

export const toggleFavorite = (category, item, idKey = '_id') => {
  const favorites = loadFavorites();
  if (!favorites[category]) {
    favorites[category] = [];
  }
  
  const existingIndex = favorites[category].findIndex(fav => fav[idKey] === item[idKey]);
  
  if (existingIndex > -1) {
    favorites[category].splice(existingIndex, 1);
  } else {
    favorites[category].push(item);
  }
  
  saveFavorites(favorites);
  return favorites[category];
};

export const clearFavorites = (category = null) => {
  if (category && category !== 'all') {
    const favorites = loadFavorites();
    favorites[category] = [];
    saveFavorites(favorites);
  } else {
    saveFavorites({});
  }
};

export const getLikedIds = (category, idKey = '_id') => {
  const favorites = getFavorites(category);
  return favorites.map(fav => fav[idKey]);
};
