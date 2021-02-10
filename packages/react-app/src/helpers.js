export const formatNumber = num => {
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 20 }).format(+num);
};

export const getBrowserLocales = (options = {}) => {
  const defaultOptions = {
    languageCodeOnly: false,
  };

  const opt = {
    ...defaultOptions,
    ...options,
  };

  const browserLocales = navigator.languages === undefined ? [navigator.language] : navigator.languages;

  if (!browserLocales) {
    return undefined;
  }

  return browserLocales.map(locale => {
    const trimmedLocale = locale.trim();

    return opt.languageCodeOnly ? trimmedLocale.split(/-|_/)[0] : trimmedLocale;
  });
};

export const formatUSD = num => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
