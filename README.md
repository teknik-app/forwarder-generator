# Bulk RetroArch Forwarder Generator

This generates forwarders for ROMs supported by NX RetroArch. Put ROMs in the `input` folder (create it if it doesn't exist) and clone https://github.com/teknik-app/forwarder-images into the `images` folder (also create it if it doesn't exist). Run `node main.js` - the forwarders will be in the `output` folder and the titledb will be in `titledb.json`, next to the script.

# How to install

install nodejs v18+

inside the directory use `npm i`

please create the following folders

images, input, output, and titles (see folder structure)

*additional steps if errors*

use the following commands

`npm install js-levenshtein`

`npm install --save inquirer@^8.0.0`

# Note
if the proper folders inside input, output, and images are not present `main.js` and `select.js` will crash
# Folder structure 
```
💾PC
 ┗ 📂Forwarder-Generator
   ┣ 📂input
   ┃ ┣ 📂gba
   ┃ ┣ 📂gb 
   ┃ ┗ 📂snes
   ┣ 📂images
   ┃ ┣ 📂gba
   ┃ ┣ 📂gb 
   ┃ ┗ 📂snes
   ┣ 📂output
   ┃ ┣ 📂gba
   ┃ ┣ 📂gb 
   ┃ ┗ 📂snes
   ┣ 📂template
   ┗ 📂titles
```

