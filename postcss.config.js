module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    // Minify CSS in production for better performance
    ...(process.env.NODE_ENV === 'production' ? {
      'cssnano': {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          colormin: true,
          minifyFontValues: true,
          minifyGradients: true,
        }]
      }
    } : {})
  },
};