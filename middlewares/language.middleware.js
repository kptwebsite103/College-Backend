function languageMiddleware(options = {}) {
  const defaultLanguage = options.default || 'en';
  const supportedLanguages = options.supported || ['en', 'es', 'fr', 'de'];

  return (req, res, next) => {
    let language = req.query.lang || req.headers['accept-language'];

    if (language) {
      // Extract primary language from Accept-Language header
      if (language.includes(',')) {
        language = language.split(',')[0];
      }
      if (language.includes(';')) {
        language = language.split(';')[0];
      }
      language = language.split('-')[0].toLowerCase(); // e.g., en-US -> en
    }

    // Check if supported
    if (!supportedLanguages.includes(language)) {
      language = defaultLanguage;
    }

    req.language = language;
    res.locals.language = language;

    next();
  };
}

module.exports = languageMiddleware;