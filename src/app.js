// app.js

import {Poisson2D} from "./moore.js"

let currentImageSrc = null;
let currentText = null;
let backgroundImage = null;
let particles = [];
const fontFile = 'XXAAVV83-Bold.ttf'
// Load the font using @font-face rule
const fontFace = new FontFace('CustomFont', `url(${fontFile})`);
fontFace.load().then(() => {
    document.fonts.add(fontFace);
})

document.addEventListener('DOMContentLoaded', () => {
  // chosing between options and appearing menus
    const imageButton = document.getElementById('imageButton');
    const textButton = document.getElementById('textButton');
    const patternButton = document.getElementById('patternButton');

    const imageMenu = document.getElementById('imageMenu');
    const textMenu = document.getElementById('textMenu');
    const patternMenu = document.getElementById('patternMenu');

    imageButton.addEventListener('click', () => {
        clearCanvas();
        imageMenu.style.display = 'block';
        textMenu.style.display = 'none';
        patternMenu.style.display = 'none';
    });

    textButton.addEventListener('click', () => {
        clearCanvas();
        imageMenu.style.display = 'none';
        textMenu.style.display = 'block';
        patternMenu.style.display = 'none';
    });

    patternButton.addEventListener('click', () => {
        clearCanvas();
        imageMenu.style.display = 'none';
        textMenu.style.display = 'none';
        patternMenu.style.display = 'block';
    });

    // image controls
    const imageInput = document.getElementById("imagePicker");
    const applyImage = document.getElementById("applyImage");

    imageInput.addEventListener("change", function(event) {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                currentImageSrc = e.target.result;
                processImage();
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    });

    applyImage.addEventListener("click", function() { 
        if (currentImageSrc) {
            processImage();
        }
    });

    // text controls
    const textInput = document.getElementById("textInput");
    const applyText = document.getElementById("applyText");

    textInput.addEventListener("input", function(event){
      currentText = event.target.value;
    });

    applyText.addEventListener("click", function() {
      if (currentText){
        processText();
      }
    });


    // pattern controls
    const bgImage = document.getElementById("bgImage");
    const generateButton = document.getElementById("generatePattern");

    bgImage.addEventListener("change", function(event) {
      if (event.target.files && event.target.files[0]) {
          const reader = new FileReader();
          reader.onload = function(e) {
              backgroundImage = e.target.result;
          };
          reader.readAsDataURL(event.target.files[0]);
      }
  });

  generateButton.addEventListener("click", function(){
    generatePattern();
  })

  // save
  document.getElementById('exportPng').addEventListener('click', function() {
    const canvas = document.getElementById('myCanvas');
    const url = canvas.toDataURL('image/png');
    download(url, 'canvas.png');
  });

  document.getElementById('exportJpeg').addEventListener('click', function() {
      const canvas = document.getElementById('myCanvas');
      const url = canvas.toDataURL('image/jpeg', 1.0); // Quality from 0 to 1
      download(url, 'canvas.jpeg');
  });

  document.getElementById('exportSvg').addEventListener('click', function() {
    const canvas = document.getElementById('myCanvas');
    const xmlns = 'http://www.w3.org/2000/svg';
    const boxWidth = canvas.width;
    const boxHeight = canvas.height;

    // Create an SVG element
    const svgElem = document.createElementNS(xmlns, 'svg');
    svgElem.setAttributeNS(null, 'viewBox', `0 0 ${boxWidth} ${boxHeight}`);
    svgElem.setAttributeNS(null, 'width', `${boxWidth}`);
    svgElem.setAttributeNS(null, 'height', `${boxHeight}`);

    // for (let i = 0; i< particles.length; i++){
    //   const particle = particles[i]
    //   const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    //   circle.setAttribute('cx', `${particle.x}`)  // x-coordinate of the center
    //   circle.setAttribute('cy', `${particle.y}`)  // y-coordinate of the center
    //   circle.setAttribute('r', `${particle.r}`)    // radius
    //   circle.setAttribute('fill', `${particle.color}`) // fill color
    //   svgElem.append(circle)
    // }
    particles.forEach(particle => {
      // console.log(particle);
      const circle = document.createElementNS(xmlns, 'circle');
      circle.setAttribute('cx', particle.x.toString());
      circle.setAttribute('cy', particle.y.toString());
      circle.setAttribute('r', particle.r.toString());
      circle.setAttribute('fill', particle.color);
      svgElem.appendChild(circle);
  });

    // Serialize the SVG to a string
    const svgContent = new XMLSerializer().serializeToString(svgElem);

    // Create a Blob from the SVG content
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });

    // Create a download link and trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'canvas_export.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(link.href);


    // // Assuming you have a p5.js-svg instance
    // // Replace with your actual p5.js-svg instance or method to get the SVG content
    // const svgContent = myP5Instance._renderer.svg.outerHTML;
    // const blob = new Blob([svgContent], {type: 'image/svg+xml'});
    // const url = URL.createObjectURL(blob);
    // download(url, 'canvas.svg');
  });

  function download(url, filename) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

});

function generatePattern(){
  clearParticles();
  const canvasWidth = parseInt(document.getElementById("widthPattern").value, 10);
  const canvasHeight = parseInt(document.getElementById("heightPattern").value, 10);
  const dotSize = parseFloat(document.getElementById("dotSizePattern").value);
  const patternDensity = parseFloat(document.getElementById("patternSize").value);
  const minDist = parseFloat(document.getElementById("minDist").value);
  const foregroundColor = document.getElementById("foregroundColorPattern").value;
  const backgroundColor = document.getElementById("backgroundColorPattern").value;
  const bgImageInput = document.getElementById("bgImage");

  const canvas = document.getElementById('myCanvas');
  const context = canvas.getContext('2d');

  // Set canvas dimensions
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Set the background
  if (bgImageInput.files && bgImageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const img = new Image();
          img.onload = function() {
              context.drawImage(img, 0, 0, canvas.width, canvas.height);
              drawPattern(context, canvasWidth, canvasHeight, dotSize, minDist, patternDensity, foregroundColor);
          };
          img.src = e.target.result;
      };
      reader.readAsDataURL(bgImageInput.files[0]);
  } else {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawPattern(context, canvasWidth, canvasHeight, dotSize, minDist, patternDensity, foregroundColor);
  }
}

function drawPattern(context, width, height, dotSize, minDist, patternDensity, foregroundColor) {
  let asp = 1 / 1.4; // Aspect ratio
  let extent = [-1, 1, -1 / asp, 1 / asp];
  const pixelMapper = new PixelMapper(width, height);
  pixelMapper.setExtentWidth(2);

  const seed = 5325 * Math.random();
  const xNoise = new Perlin(5631 * seed, 0.5, 10, 0.5);
  const yNoise = new Perlin(7242 * seed, 0.5, 10, 0.5);

  // Define the extent of the area where circles will be generated
  const circles = generateCircles(extent, 0.25, 0.5, Math.random);
  const nCircles = circles.length;

  const warpSizeX = Math.random(0.1, 1);
  const warpSizeY = Math.random(0.1, 1);
  const numWarps = Math.floor(Math.random(1, 10 + 1));

  // minDist = Math.random(0.004, 0.006);

  const pds = new Poisson2D({
    extent: extent,
    minDistance: minDist,
    maxDistance: minDist * Math.random(5, 10),
    distanceFunction: function(pt) {
      let [x, y] = pt;
      let warpScale = 1;
      for (let i = 0; i < numWarps; i++) {
        const dx = -1 + 2 * xNoise.ev(x, y);
        const dy = -1 + 2 * yNoise.ev(x, y);
        x += warpScale * warpSizeX * dx;
        y += warpScale * warpSizeY * dy;
        warpScale *= 0.9;
      }
      for (let i = 0; i < nCircles; i++) {
        const circ = circles[i];
        const [cX, cY] = circ.center;
        if (Math.hypot(cX - x, cY - y) < circ.radius) return circ.dist;
      }
      return 1;
    },
    tries: 10,
}, Math.random);
while (true){
    let pt = pds.next();
    if (!pt) break;
    // console.log(pt, pixelMapper.toPixel(pt[0], pt[1]));
    pt = pixelMapper.toPixel(pt[0], pt[1]);
    let d = pds.getLastDistance();
    let dCbrt = Math.pow(d, 1/3);
    let idx = Math.floor(dCbrt*patternDensity);
    // let idx = 0;
    if (idx == 0){

      context.fillStyle = foregroundColor;
      let particle = new Particle(pt[0], pt[1], dotSize, foregroundColor);
      particles.push(particle);
      context.fillRect(
        Math.round(pt[0]) - dotSize / 2,
        Math.round(pt[1]) - dotSize / 2,
        dotSize,
        dotSize
      );
    }
  }
  console.log("out of while");
}

// Helper functions and classes
function generateCircles(extent, minRadius=0.1, maxRadius=2, rng) {
  const circles = [];  
  const pds = new Poisson2D({ extent, minDistance: 0.1 }, rng);

  const centers = pds.fill();
  const n = centers.length;

  for (let i = 0; i < n; i++) {
      const radius = minRadius + rng() * (maxRadius - minRadius);
      const dist = Math.pow(rng(), 3); // Bias towards lower values
      circles.push({
          center: centers[i],
          radius: radius,
          dist: dist
      });
  }

  return circles;
}


class Perlin {
  constructor(seed, range = 1, octaves = 4, falloff = 0.5) {
      this.xOffset = Math.random() * 1000;
      this.yOffset = Math.random() * 1000;
      this.range = range;
      this.octaves = octaves;
      this.falloff = falloff;

      this.normConst = 0;
      let ampl = 0.5;
      for (let i = 0; i < octaves; i++) {
          this.normConst += ampl;
          ampl *= falloff;
      }
  }

  ev(x, y) {
      let total = 0;
      let frequency = 1;
      let amplitude = 1;
      let maxValue = 0;
      for(let i = 0; i < this.octaves; i++) {
          total += noise((x + this.xOffset) * frequency / this.range, 
                         (y + this.yOffset) * frequency / this.range) * amplitude;
          
          maxValue += amplitude;
          amplitude *= this.falloff;
          frequency *= 2;
      }
      return total / maxValue;
  }
}

class PixelMapper {
  constructor(pixelWidth, pixelHeight) {
      this.size = [pixelWidth, pixelHeight];
      this.asp = pixelWidth / pixelHeight;
      this.setFlipY(false);
      this.setExtentWidth(2); // Default extent width
  }

  setFlipY(value) {
      this.ySign = value ? -1 : 1;
  }

  setExtentWidth(width) {
      this.width = width;
      this.height = width / this.asp;
  }

  pixelToUnit(column, row) {
      const [w, h] = this.size;
      return [(column + 0.5) / w, (row + 0.5) / h];
  }

  unitToPixel(u, v) {
      const [w, h] = this.size;
      return [u * w - 0.5, v * h - 0.5];
  }

  fromPixel(column, row) {
      let [u, v] = this.pixelToUnit(column, row);
      let x = (u - 0.5) * this.width;
      let y = (v - 0.5) * this.height * this.ySign;
      return [x, y];
  }

  toPixel(x, y) {
      if (y == undefined) y = x;
      let u = x / this.width + 0.5;
      let v = y * this.ySign / this.height + 0.5;
      // console.log("xy:", x, y);
      // console.log("uv", u, v);
      return this.unitToPixel(u, v);
  }
}


function processText(){
  clearParticles();
  const canvasWidth = parseInt(document.getElementById("width").value, 10)
  const canvasHeight = parseInt(document.getElementById("height").value, 10)
  const fontSize = parseInt(document.getElementById("fontSize").value, 10);
  const dotSize = parseFloat(document.getElementById("dotSizeText").value);
  const maxDist = parseInt(document.getElementById("maxDistText").value, 10);
  const density = parseFloat(document.getElementById("densityText").value);
  const foregroundColor = document.getElementById("foregroundColorText").value;
  const backgroundColor = document.getElementById("backgroundColorText").value;
  const tempCanvas = document.createElement('canvas');
  const tempContext = tempCanvas.getContext('2d');
  const mainCanvas = document.getElementById('myCanvas');
  const context = mainCanvas.getContext('2d');

  tempCanvas.width = canvasWidth;
  tempCanvas.height = canvasHeight;
        
  // Set the canvas background to white
  tempContext.fillStyle = 'white';
  tempContext.fillRect(0, 0, canvasWidth, canvasHeight);
      
  tempContext.font = String(fontSize) + 'px CustomFont';
  tempContext.fillStyle = 'black';
  tempContext.textAlign = 'center';
  tempContext.textBaseline = 'middle';
  tempContext.fillText(currentText, canvasWidth / 2, canvasHeight / 2);

  getImageData(tempCanvas.toDataURL(), function(imageData) {
    // Clear and set up the main canvas
    mainCanvas.width = tempCanvas.width;
    mainCanvas.height = tempCanvas.height;
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    // Process and draw the dots
    var pds = new PoissonDiskSampling({
      shape: [imageData.width, imageData.height],
      minDistance: density,
      maxDistance: maxDist,
      tries: 30,
      distanceFunction: function(point) {
        var pixelIndex = (Math.round(point[0]) + Math.round(point[1]) * imageData.width) * 4;
        return Math.pow(imageData.data[pixelIndex] / 255, 2.7);
        }
    });

    var points = pds.fill();
    context.fillStyle = foregroundColor;

    points.forEach(function(point) {
      let particle = new Particle(point[0], point[1], dotSize, foregroundColor);
      particles.push(particle);
      context.fillRect(
        Math.round(point[0]),
        Math.round(point[1]),
        dotSize,
        dotSize
      );
    });
  });
}

function processImage() {
  clearParticles();
    const dotSize = parseInt(document.getElementById("dotSize").value, 10);
    const density = parseInt(document.getElementById("density").value, 10);
    const foregroundColor = document.getElementById("foregroundColor").value;
    const backgroundColor = document.getElementById("backgroundColor").value;

    getImageData(currentImageSrc, function(imageData) {
        var pds = new PoissonDiskSampling({
            shape: [imageData.width, imageData.height],
            minDistance: density,
            maxDistance: density * 5,
            tries: 30,
            distanceFunction: function(point) {
                var pixelIndex = (Math.round(point[0]) + Math.round(point[1]) * imageData.width) * 4;
                return Math.pow(imageData.data[pixelIndex] / 255, 2.7);
            }
        });

        var points = pds.fill();
        var canvas = document.getElementById('myCanvas'),
            context = canvas.getContext('2d');

        canvas.width = imageData.width;
        canvas.height = imageData.height;

        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = foregroundColor;

        points.forEach(function(point) {
          let particle = new Particle(point[0], point[1], dotSize, foregroundColor);
          particles.push(particle);
          context.fillRect(
                Math.round(point[0]),
                Math.round(point[1]),
                dotSize,
                dotSize
            );
        });
    });
}

function getImageData(url, callback) {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        img = new Image();

    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        callback(context.getImageData(0, 0, img.width, img.height));
    };

    img.src = url;
}

function clearCanvas() {
  clearParticles();
  const canvas = document.getElementById('myCanvas');
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
}

class Particle{
  constructor(x, y, r, color){
    this.x = x;
    this.y = y;
    this.r = r/2;
    this.color = color;
  }
}

// Function to clear all particles
function clearParticles() {
  particles = [];
}