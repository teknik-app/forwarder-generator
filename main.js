const fs = require('fs');
const path = require('path');
const levenshtein = require('js-levenshtein');
const canvas = require('canvas');
const {execSync} = require('child_process');


let inputDirs = ['./input']
let imageDirs = ['./images']

let tempDir = './temp'

let tidPrefix = '01337'
let tidSuffix = '0000'

let coresPrefix = 'sdmc:/retroarch/cores'
let romsPrefix = 'sdmc:/roms'

let platforms = require('./platforms.json') // I probably missed a bunch





async function main () {

  let inputFiles = []
  let imageFiles = []

  let tidCounter = 0

  let titles = {}


  for(dir of inputDirs) {

    for(file of readDirRecursive(dir)) {
      inputFiles.push({name: file.split('/').pop().split('\\').pop(), path: file})
    }
  }

  for(dir of imageDirs) {

    for(file of readDirRecursive(dir)) {
      imageFiles.push({name: file.split('/').pop().split('\\').pop(), path: file})
    } 
  }


  for(file of inputFiles) {

    let name = file.name.split('.').slice(0, -1).join('.')
    let ext = file.name.split('.').pop()

    let emuNro
    let romFolder

    for(platform of platforms) {
      if(platform.extensions.includes(ext)) {
        emuNro = platform.emuNro
        romFolder = platform.romFolder
        break
      }
    }

    let gameName = name.split(' ')
    for(let i = 0; i < gameName.length; i++) {
      if(gameName[i].startsWith('(')) {
        gameName = gameName.slice(0, i)
        break
      }
    }
    gameName = gameName.join(' ')

    let bestMatch = {name: '', path: '', distance: Infinity}

    for(image of imageFiles) {

      let imageGameName = image.name.split(' ')
      for(let i = 0; i < imageGameName.length; i++) {
        if(imageGameName[i].startsWith('(')) {
          imageGameName = imageGameName.slice(0, i)
          break
        }
      }
      imageGameName = imageGameName.join(' ')

      let distance = levenshtein(gameName, imageGameName)
      if(distance < bestMatch.distance) {
        bestMatch = {name: image.name, path: image.path, distance: distance}
      }
    }

    console.log(`Best match for ${file.name} is ${bestMatch.name} with a distance of ${bestMatch.distance}`)
    console.log(bestMatch.path)


    // create TID

    let tid = tidPrefix + tidCounter.toString(16).padStart(16 - (tidPrefix.length) - (tidSuffix.length), '0') + tidSuffix
    tidCounter++
    console.log(`TID: ${tid}`)



    // add to titledb

    titles[tid.toUpperCase()] = {
      "id": tid.toUpperCase(),
      "name": name,
      "iconUrl": `https://raw.githubusercontent.com/teknik-app/forwarder-images/main/${encodeURI(bestMatch.path.split('\\').join('/').split('/').slice(1).join('/'))}`,
      "region": "US",
      "description": `RetroArch forwarder for roms/${romFolder}/${name}.${ext}`,
    }


    // figure out paths

    let tempPath = path.join(tempDir, tid)
    let outputPath = path.join('output', tid)

    // create temp and output directory
    fs.mkdirSync(tempPath, {recursive: true})
    fs.mkdirSync(outputPath, {recursive: true})


    // copy everything from the template directory to the temp directory

    let templateFiles = fs.readdirSync(path.join(__dirname, 'template'))



    for(file of templateFiles) {
      fs.cpSync(path.join(__dirname, 'template', file), path.join(__dirname, tempPath, file), {recursive: true})
    }


    // create canvas, center and resize image
    {
      let imageCanvas = canvas.createCanvas(256, 256)
      let ctx = imageCanvas.getContext('2d')

      let image = await canvas.loadImage(bestMatch.path)
      let imageRatio = image.width / image.height
      let canvasRatio = imageCanvas.width / imageCanvas.height

      if(imageRatio > canvasRatio) {
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, (imageCanvas.height - (imageCanvas.width / imageRatio)) / 2, imageCanvas.width, imageCanvas.width / imageRatio)
      } else {
        ctx.drawImage(image, 0, 0, image.width, image.height, (imageCanvas.width - (imageCanvas.height * imageRatio)) / 2, 0, imageCanvas.height * imageRatio, imageCanvas.height)
      }

      // write canvas to file
      let jpegStream = imageCanvas.createJPEGStream()
      let jpegData = await jpegStream.read()
      
      fs.writeFileSync(path.join(tempPath, 'control', 'icon_AmericanEnglish.dat'), jpegData)



    }

    let nroPath = `${coresPrefix}/${emuNro}`;
    let argv = `${nroPath} "${romsPrefix}/${romFolder}/${name}.${ext}"`

    console.log(nroPath)
    console.log(argv)

    fs.writeFileSync(path.join(tempPath, 'romfs', 'nextNroPath'), nroPath)
    fs.writeFileSync(path.join(tempPath, 'romfs', 'nextArgv'), argv)

    // run hacbrewpack

    let hacbrewpackCommand = `${path.join(__dirname, 'hacbrewpack.exe')} --titleid ${tid} --titlename "${name}" --titlepublisher TK --nspdir ${path.join(__dirname, outputPath)} -k ${path.join(__dirname, 'prod.keys')}`

    execSync(hacbrewpackCommand, {cwd: tempPath})

    fs.renameSync(path.join(__dirname, outputPath, `${tid}.nsp`), path.join(__dirname, 'output', `${name} [${tid}].nsp`))

    // cleanup

    fs.rmSync(tempPath, {recursive: true})
    fs.rmSync(outputPath, {recursive: true})

  }


  fs.writeFileSync(path.join(__dirname, 'titles.json'), JSON.stringify(titles, null, 2))
  
  
  
  function readDirRecursive (dir) { // reads a directory recursively and returns an array of files
    let files = []
    for(file of fs.readdirSync(dir)) {
      let filePath = path.join(dir, file)
      let stat = fs.statSync(filePath)
  
      if(stat.isDirectory()) {
        files.push(...readDirRecursive(filePath))
      } else {
        files.push(filePath)
      }
    }
    return files
  }

  
}




main()

