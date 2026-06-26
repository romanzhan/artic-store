export function createAssetResolver(modules) {
  const entries = Object.entries(modules);
  return (name) => {
    if (!name) return '';
    const found = entries.find(([path]) => path.endsWith(`/${name}.webp`));
    return found ? found[1] : '';
  };
}
