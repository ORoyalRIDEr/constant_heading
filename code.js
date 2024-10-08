var globeRadiusPx = 0;
var globeCenterPx = [0, 0];
var startPointPx = undefined;
var headingDeg = 60;

var mouseIsCliked = false;

addEventListener('load', function(e) {
    resizeCanvas();
    draw();

    // Canvas
    let canvas = this.document.getElementById('drawCanvas');

    canvas.addEventListener('mousemove', moveMouseHandler);
    canvas.addEventListener('mousedown', function(e) {
        mouseIsCliked = true;
        moveMouseHandler(e);
    });
    canvas.addEventListener('mouseup', function(e) {
        mouseIsCliked = false;
    });

    // Setup
    let headingInput = this.document.getElementById('heading');
    let headingShow = this.document.getElementById('headingShow');
    
    headingShow.innerHTML = `${headingDeg}°`;
    headingInput.value = headingDeg;

    headingInput.addEventListener('input', function(e) {
        headingDeg = +headingInput.value;
        headingShow.innerHTML = `${headingDeg}°`;
        draw();
    });
  });

addEventListener('resize', function(e) {
    resizeCanvas();
    draw();
  });

function resizeCanvas()
{
    let canvas = this.document.getElementById('drawCanvas');
    let ctx = canvas.getContext('2d');

    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = window.innerHeight;

    globeRadiusPx = canvas.width / 3;
    globeCenterPx = [canvas.width/2, globeRadiusPx + 50];

    startPointPx = globeCenterPx;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
  
function draw() {
    let canvas = this.document.getElementById('drawCanvas');
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawEarthWireframe(ctx, globeCenterPx, globeRadiusPx);
    drawFlightPath(ctx);
}

function drawEarthWireframe(ctx, center, radius)
{
    /* Meridians */
    ctx.strokeStyle = "antiquewhite";

    let meridianCount = 8;
    let thetaCount = 50;

    for (let iMeridian = 0; iMeridian <= meridianCount; iMeridian++)
    {
        let meridian = (iMeridian / meridianCount) * Math.PI - Math.PI/2;
        
        ctx.beginPath();
        ctx.moveTo(center[0], center[1] - radius); // north pole
        
        for (let iTheta = 0; iTheta <= thetaCount; iTheta++)
        {
            let theta = (iTheta / thetaCount) * Math.PI - Math.PI/2;

            let x = Math.cos(theta) * Math.sin(meridian) * radius + center[0];
            let y = Math.sin(theta) * radius + center[1];

            ctx.lineTo(x, y);
        }

        ctx.stroke();
    }

    /* Equator */
    ctx.beginPath();
    ctx.moveTo(center[0] - radius, center[1]);
    ctx.lineTo(center[0] + radius, center[1]);
    ctx.stroke();
}

function drawFlightPath(ctx)
{
    if (!startPointPx)
        return;

    let flightpath = calculateFlightPath();
    
    ctx.beginPath();
    ctx.arc(startPointPx[0], startPointPx[1], 10, 0, 2*Math.PI)
    ctx.stroke();

    // flightpath 
    ctx.strokeStyle = "#4848b3";
    ctx.beginPath();

    let point = flightpath.shift();
    let x =  Math.cos(point[0]) * Math.sin(point[1]) * globeRadiusPx + globeCenterPx[0];
    let y = -Math.sin(point[0]) * globeRadiusPx + globeCenterPx[1];
    ctx.moveTo(x, y);
    
    for (let point of flightpath)
    {
        let x =  Math.cos(point[0]) * Math.sin(point[1]) * globeRadiusPx + globeCenterPx[0];
        let y = -Math.sin(point[0]) * globeRadiusPx + globeCenterPx[1];

        ctx.lineTo(x, y);
    }

    ctx.stroke();
}

function calculateFlightPath()
{
    let MAX_ITERATIONS = 5000;
    let STEP_SIZE = 100000; // m
    let EARTH_RADIUS = 6378137; // m
    let EARTH_CIRC = 2 * Math.PI * EARTH_RADIUS;

    let startPointRel = [
         (startPointPx[0] - globeCenterPx[0]) / globeRadiusPx,
        -(startPointPx[1] - globeCenterPx[1]) / globeRadiusPx,
    ]
    let lat = Math.asin( startPointRel[1] );
    let lon = Math.asin( startPointRel[0] / Math.cos(lat) );
    
    currentPos = [lat, lon];
    setPosStr(currentPos);
    flightpath = []
    flightpath.push(currentPos)

    let heading = headingDeg / 180 * Math.PI;
    let sHeading = Math.sin(heading);
    let cHeading = Math.cos(heading);

    let deltaLat = cHeading * STEP_SIZE / EARTH_RADIUS;

    while (
        (flightpath.length <= MAX_ITERATIONS) && 
        ((currentPos[0] * 180 / Math.PI) < 89) &&
        ((currentPos[0] * 180 / Math.PI) > -89)
    )
    {
        let meanLat = currentPos[0] + deltaLat / 2;
        let deltaLon = sHeading * STEP_SIZE / (EARTH_RADIUS * Math.cos(meanLat));

        currentPos = [
            currentPos[0] + deltaLat,
            currentPos[1] + deltaLon,
        ];
        flightpath.push(currentPos);
    }

    return flightpath;
}

function moveMouseHandler(event)
{
    if (!mouseIsCliked) 
        return;

    let mousePos = [event.offsetX, event.offsetY];
    let distFromCenter = Math.sqrt(
        (globeCenterPx[0] - mousePos[0]) * (globeCenterPx[0] - mousePos[0]) + 
        (globeCenterPx[1] - mousePos[1]) * (globeCenterPx[1] - mousePos[1])
    );

    // only allow start positions on globe
    if (distFromCenter < globeRadiusPx)
    {
        startPointPx = mousePos;

        draw();
    }
}

function setPosStr(pos)
{
    let posStr = ''

    let retLat = degreeToStr(pos[0]*180/Math.PI);
    posStr += retLat[1];
    posStr += retLat[0] ? 'S' : 'N';

    posStr += ' ';

    let retLon = degreeToStr(pos[1]*180/Math.PI);
    posStr += retLon[1];
    posStr += retLon[0] ? 'W' : 'E';

    console.log(document.getElementById('pos'))
    document.getElementById('posInput').value = posStr;
}

function degreeToStr(degree)
{
    let sign = (degree < 0.0);
    degree = Math.abs(degree);
    let deg = Math.floor(degree);
    let hours = Math.floor((degree - deg) * 60);
    let sec = Math.floor((((degree - deg) * 60) - hours) * 60);

    return[sign, `${deg}°${hours}'${sec}"`]
}