webpack --config webpack.config.js

# copying config files for ckeditor
mkdir -p ./src/public/dist/src/public/js/helpers
cp -a ./src/public/js/helpers/ckeditor ./src/public/dist/src/public/js/helpers

# copying styles
mkdir -p ./src/public/dist/src/public/css
cp ./src/public/css/main_en.css ./src/public/dist/src/public/css/main_en.css
cp ./src/public/css/main_ar.css ./src/public/dist/src/public/css/main_ar.css

# copying fonts
cp -a ./src/public/fonts ./src/public/dist/src/public

# copying images
cp -a ./src/public/images ./src/public/dist/src/public