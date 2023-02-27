
//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda
// became:
//
// BasicShapes.js  MODIFIED for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//		--converted from 2D to 4D (x,y,z,w) vertices
//		--extend to other attributes: color, surface normal, etc.
//		--demonstrate how to keep & use MULTIPLE colored shapes in just one
//			Vertex Buffer Object(VBO). 
//		--create several canonical 3D shapes borrowed from 'GLUT' library:
//		--Demonstrate how to make a 'stepped spiral' tri-strip,  and use it
//			to build a cylinder, sphere, and torus.
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
var isDrag=false;
var viewPort2 = false;
var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
													// (x,y,z,w)position + (r,g,b)color
													// Later, see if you can add:
													// (x,y,z) surface normal + (tx,ty) texture addr.
var lowerCraneArmAngle  = 0.0;
var lowerCraneArmAngleRate = 200.0;

var cylAngle = 0;
var cylAngleRate = 300;

var shakerHeight = 0;
var shakerHeightRate = 2;

var butterflyHeight = 0;
var flySpeedChangeRate = 5;
var butterflyRotateAngle = 20;
var butterflyRotateAngleRate = 70;
var wingAngle = 0;
var wingAngleRate = 100;
var stringLength = 7;	
var gl;
var g_EyeX = -4.5, g_EyeY =-1.5, g_EyeZ = 2; 
var theta = 44;  
var deltaZ = -0.35; //i think change from eye point to the aim point, //both cintrolled by mouse
                 // eye point is eye +(aim - eye)

var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0; 
var canvas = document.getElementById('webgl');
var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1);	// 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();	
var projMatrix = new Matrix4();	
var orthoMatrix = new Matrix4();


function main() {
//==============================================================================
  // Retrieve <canvas> element

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  window.addEventListener("keydown", myKeyDown, false);
//  window.addEventListener("mousemove", myMouseMove);
 // window.addEventListener("mousedown", myMouseDown);
  //window.addEventListener("mouseup", myMouseUp);
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  // when user's mouse button goes down, call mouseDown() function
canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
						// when the mouse moves, call mouseMove() function					
canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST); 	 
	 
//==============================================================================
// STEP 4:   REMOVE This "reversed-depth correction"
//       when you apply any of the 3D camera-lens transforms: 
//      (e.g. Matrix4 member functions 'perspective(), frustum(), ortho() ...)
//======================REVERSED-DEPTH Correction===============================

  //  b) reverse the usage of the depth-buffer's stored values, like this:
 // gl.enable(gl.DEPTH_TEST); // enabled by default, but let's be SURE.
 // gl.clearDepth(0.0);       // each time we 'clear' our depth buffer, set all
                            // pixel depths to 0.0  (1.0 is DEFAULT)
 // gl.depthFunc(gl.GREATER); // draw a pixel only if its depth value is GREATER
                            // than the depth buffer's stored value.
                            // (gl.LESS is DEFAULT; reverse it!)
//=====================================================================

  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
  
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;

//-----------------  
  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
	
   drawResize();
   drawAll(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw shapes

    currentAngle = animate(currentAngle);  // Update the rotation angle
    // report current angle on console
    //console.log('currentAngle=',currentAngle);
    requestAnimationFrame(tick, canvas);  
	//FIX: only rotations from when the camera is behind x-axis work; revolves around x-axis
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image
    
}

function initVertexBuffer(gl) {
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.
 
 	// Make each 3D shape in its own array of vertices:
  makeCylinder();					// create, fill the cylVerts array
  makeSphere();						// create, fill the sphVerts array
  makeTorus();						// create, fill the torVerts array
  makeGroundGrid();				// create, fill the gndVerts array
  makeCrane();
  makeButterfly();
  // how many floats total needed to store all shapes?
  
	var mySiz = (cylVerts.length + sphVerts.length + 
							 torVerts.length + gndVerts.length + 
							 RectPrismVerts.length + AbdomenVerts.length + CmpndEyesVerts.length
							 + SpecPrt1Verts.length + SpecPrt2Verts.length + SpecPrt3Verts.length + SpecPrt4Verts.length 
							 + SpecPrt5Verts.length + SpecPrt6Verts.length + SpecPrt7Verts.length + SpecPrt8Verts.length 
							 + AxesVerts.length);						

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cylStart = 0;							// we stored the cylinder first.
  for(i=0,j=0; j< cylVerts.length; i++,j++) {
  	colorShapes[i] = cylVerts[j];
		}
		sphStart = i;						// next, we'll store the sphere;
	for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sphVerts[j];
		}
		torStart = i;						// next, we'll store the torus;
	for(j=0; j< torVerts.length; i++, j++) {
		colorShapes[i] = torVerts[j];
		}
		gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		colorShapes[i] = gndVerts[j];
		}
		RectPrismStart = i;
		for(j=0; j< RectPrismVerts.length; i++, j++) {
			colorShapes[i] = RectPrismVerts[j];
			}
		AbdomenStart = i;
		for(j=0; j< AbdomenVerts.length; i++, j++) {
			colorShapes[i] = AbdomenVerts[j];
			}
		CmpndEyesStart = i;
		for(j=0; j< CmpndEyesVerts.length; i++, j++) {
			colorShapes[i] = CmpndEyesVerts[j];
			}
		SpecPrt1Start = i; 
		for(j=0; j< SpecPrt1Verts.length; i++, j++) {
			colorShapes[i] = SpecPrt1Verts[j];
			}
		SpecPrt2Start = i;
		for(j=0; j< SpecPrt2Verts.length; i++, j++) {
			colorShapes[i] = SpecPrt2Verts[j];
			}
		SpecPrt3Start = i;
		for(j=0; j< SpecPrt3Verts.length; i++, j++) {
			colorShapes[i] = SpecPrt3Verts[j];
			}
		SpecPrt4Start = i;
		for(j=0; j< SpecPrt4Verts.length; i++, j++) {
			colorShapes[i] = SpecPrt4Verts[j];
			}
		SpecPrt5Start = i;
		for(j=0; j< SpecPrt5Verts.length; i++, j++) {
			colorShapes[i] = SpecPrt5Verts[j];
			}
		SpecPrt6Start = i;
		for(j=0; j< SpecPrt6Verts.length; i++, j++) {
			colorShapes[i] = SpecPrt6Verts[j];
			}
		SpecPrt7Start = i;
		for(j=0; j< SpecPrt7Verts.length; i++, j++) {
			colorShapes[i] = SpecPrt7Verts[j];
			}
		SpecPrt8Start = i;
		for(j=0; j< SpecPrt8Verts.length; i++, j++) {
			colorShapes[i] = SpecPrt8Verts[j];
			}
		AxesStart = i;
		for(j=0; j< AxesVerts.length; i++, j++) {
			colorShapes[i] = AxesVerts[j];
			}			
  // Create a buffer object on the graphics hardware:
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

  // Use handle to specify how to retrieve **POSITION** data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve **COLOR** data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

// simple & quick-- 
// I didn't use any arguments such as color choices, # of verts,slices,bars, etc.
// YOU can improve these functions to accept useful arguments...
//
function makeCrane(){
	AxesVerts = new Float32Array([
	0.0,  0.0,  0.0, 1.0,		0.3,  0.3,  0.3,	// X axis line (origin: gray)
	1.3,  0.0,  0.0, 1.0,		1.0,  0.3,  0.3,	// 						 (endpoint: red)
	
	0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,	// Y axis line (origin: white)
	0.0,  1.3,  0.0, 1.0,		0.3,  1.0,  0.3,	//						 (endpoint: green)

	0.0,  0.0,  0.0, 1.0,		0.3,  0.3,  0.3,	// Z axis line (origin:white)
	0.0,  0.0,  1.3, 1.0,		0.3,  0.3,  1.0,	//
	]);
	SpecPrt1Verts = new Float32Array([
	//12, 6
	0.0, 0.0, 0.0, 1.0,			1.0, 0.0, 0.0,		// r
	0.5, 0.0, 0.0, 1.0,     	1.0, 1.0, 0.0,	  // ylw
	0.0, 0.5, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk
   
	0.5, 0.5, 0.0, 1.0,  1.0, 0.0, 0.0,		// r  					
	0.5, 0.0, 0.0, 1.0,  1.0, 1.0, 0.0,	  // ylw 	
	0.0, 0.5, 0.0, 1.0,  0.0, 0.0, 0.0,		// blk
	]);
	SpecPrt2Verts = new Float32Array([
	//24, 18
	0.5, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
	0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
	0.5, 0.5, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk

	0.5, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
	0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
	0.5, 0.5, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
	//left rn X
   0.0, 0.0, 0.5, 1.0,			1.0, 1.0, 1.0,		// w
   0.0, 0.0, 0.0, 1.0,     	0.0, 0.0, 1.0,	  // b
   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk

   0.0, 0.5, 0.0, 1.0,			0.0, 0.0, 1.0,	  // b
   0.0, 0.0, 0.0, 1.0,     	1.0, 1.0, 1.0,		// w
   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
   //bottom rn X
   0.0, 0.0, 0.5, 1.0,			0.5, 0.5, 0.5,		//g
   0.5, 0.0, 0.5, 1.0,     	1.0, 1.0, 0.0,	  // y
   0.0, 0.5, 0.5, 1.0,			0.0, 1.0, 1.0,		// cyan
  
   0.5, 0.5, 0.5, 1.0,  0.0, 1.0, 0.0, // g    					
   0.5, 0.0, 0.5, 1.0,  1.0, 0.0, 1.0, // prpl  	
   0.0, 0.5, 0.5, 1.0,  0.0, 0.0, 0.0, //blk
	]);
	SpecPrt3Verts = new Float32Array([
   //12, 3
   0.0, 0.0, 0.0, 1.0,			1.0, 0.0, 0.0,		// r
	0.5, 0.0, 0.0, 1.0,     	1.0, 1.0, 0.0,	  // ylw
	0.0, 0.5, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk
	]);
	SpecPrt4Verts = new Float32Array([
   //18, 6
   0.0, 0.0, 0.5, 1.0,			1.0, 0.0, 0.0,		// r
	0.5, 0.0, 0.5, 1.0,     	0.0, 0.0, 0.0,		// blk
	0.0, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
   
	0.5, 0.0, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk
	0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
	0.0, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
	]);
	SpecPrt5Verts = new Float32Array([
	//30, 9
	0.0, 0.0, 0.5, 1.0,			1.0, 1.0, 1.0,		// w
   0.0, 0.0, 0.0, 1.0,     	0.0, 0.0, 1.0,	  // b
   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk

   0.0, 0.5, 0.0, 1.0,			0.0, 0.0, 1.0,	  // b
   0.0, 0.0, 0.0, 1.0,     	1.0, 1.0, 1.0,		// w
   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
   //bottom rn X
   0.0, 0.0, 0.5, 1.0,			0.5, 0.5, 0.5,		//g
   0.5, 0.0, 0.5, 1.0,     	1.0, 1.0, 0.0,	  // y
   0.0, 0.5, 0.5, 1.0,			0.0, 1.0, 1.0,		// cyan
	]);
	SpecPrt6Verts = new Float32Array([
	// 15, 3
	0.5, 0.5, 0.0, 1.0,  1.0, 0.0, 0.0,		// r  					
	0.5, 0.0, 0.0, 1.0,  1.0, 1.0, 0.0,	  // ylw 	
	0.0, 0.5, 0.0, 1.0,  0.0, 0.0, 0.0,		// blk
	]);
	SpecPrt7Verts = new Float32Array([
	//24, 6
	0.5, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
	0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
	0.5, 0.5, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk

	0.5, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
	0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
	0.5, 0.5, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
	]);
	//39, 9
	SpecPrt8Verts = new Float32Array([
	0.5, 0.5, 0.5, 1.0,  0.0, 1.0, 0.0, // g    					
	0.5, 0.0, 0.5, 1.0,  1.0, 0.0, 1.0, // prpl  	
	0.0, 0.5, 0.5, 1.0,  0.0, 0.0, 0.0, //blk
	//top rn X
	0.0, 0.5, 0.0, 1.0,			1.0, 0.0, 0.0,		// r
	0.5, 0.5, 0.0, 1.0,     	0.0, 1.0, 0.0,	  // g
	0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 1.0,		// b
 
	0.5, 0.5, 0.5, 1.0,			.0, 0.0, 1.0,		// b
	0.5, 0.5, 0.0, 1.0,     	1.0, 0.0, 0.0,		// r
	0.0, 0.5, 0.5, 1.0,			 	0.0, 1.0, 0.0,	  // g
	]);
}
function makeButterfly(){
	RectPrismVerts = new Float32Array([
		0.0, 0.0, 0.0, 1.0,			1.0, 0.0, 0.0,		// r
		0.5, 0.0, 0.0, 1.0,     	1.0, 1.0, 0.0,	  // ylw
		0.0, 0.5, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk
	   
		0.5, 0.5, 0.0, 1.0,  1.0, 0.0, 0.0,		// r  					
		0.5, 0.0, 0.0, 1.0,  1.0, 1.0, 0.0,	  // ylw 	
		0.0, 0.5, 0.0, 1.0,  0.0, 0.0, 0.0,		// blk
		//bot-mid rn X
		0.0, 0.0, 0.5, 1.0,			1.0, 0.0, 0.0,		// r
		0.5, 0.0, 0.5, 1.0,     	0.0, 0.0, 0.0,		// blk
		0.0, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
	   
		0.5, 0.0, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk
		0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
		0.0, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
		// right rn X
		0.5, 0.0, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
		0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
		0.5, 0.5, 0.0, 1.0,			0.0, 0.0, 0.0,		// blk
	
		0.5, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
		0.5, 0.0, 0.5, 1.0,     	1.0, 0.0, 0.0,		// r
		0.5, 0.5, 0.0, 1.0,			1.0, 1.0, 0.0,	  // ylw
		//left rn X
	   0.0, 0.0, 0.5, 1.0,			1.0, 1.0, 1.0,		// w
	   0.0, 0.0, 0.0, 1.0,     	0.0, 0.0, 1.0,	  // b
	   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
	
	   0.0, 0.5, 0.0, 1.0,			0.0, 0.0, 1.0,	  // b
	   0.0, 0.0, 0.0, 1.0,     	1.0, 1.0, 1.0,		// w
	   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
	   //bottom rn X
	   0.0, 0.0, 0.5, 1.0,			0.5, 0.5, 0.5,		//g
	   0.5, 0.0, 0.5, 1.0,     	1.0, 1.0, 0.0,	  // y
	   0.0, 0.5, 0.5, 1.0,			0.0, 1.0, 1.0,		// cyan
	  
	   0.5, 0.5, 0.5, 1.0,  0.0, 1.0, 0.0, // g    					
	   0.5, 0.0, 0.5, 1.0,  1.0, 0.0, 1.0, // prpl  	
	   0.0, 0.5, 0.5, 1.0,  0.0, 0.0, 0.0, //blk
	   //top rn X
	   0.0, 0.5, 0.0, 1.0,			1.0, 0.0, 0.0,		// r
	   0.5, 0.5, 0.0, 1.0,     	0.0, 1.0, 0.0,	  // g
	   0.0, 0.5, 0.5, 1.0,			0.0, 0.0, 1.0,		// b
	
	   0.5, 0.5, 0.5, 1.0,			.0, 0.0, 1.0,		// b
	   0.5, 0.5, 0.0, 1.0,     	1.0, 0.0, 0.0,		// r
	   0.0, 0.5, 0.5, 1.0,			 	0.0, 1.0, 0.0,	  // g
	]);
	AbdomenVerts = new Float32Array([
	0.0, 0.25, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
	0.25, 0.0, 0.5, 1.0,     	1.0, 1.0, 1.0,		// white
	0.25, 0.15, 1.0, 1.0,			0.0, 0.0, 0.0,		// blk
	//abdomen top-right
	0.5, 0.25, 0.5, 1.0,			0.0, 0.0, 0.0,		// blk
	0.25, 0.5, 0.5, 1.0,     	1.0, 1.0, 1.0,		// white
	0.25, 0.15, 1.0, 1.0,			0.0, 0.0, 0.0,		// blk
	//abdomen small middle
	0.15, 0.12, 1.20, 1.0,			0.0, 0.0, 0.0,		// blk
	0.20, 0.12, 1.20, 1.0,     	1.0, 1.0, 1.0,		// white
	0.25, 0.15, 1.0, 1.0,			1.0, 1.0, 1.0,		// white
	]);
	CmpndEyesVerts = new Float32Array([
	0.0, 0.0, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
	0.5, 0.0, 0.0, 1.0,     	1.0, 0.0, 0.0,	  // r
	0.0, 0.5, 0.0, 1.0,			1.0, 0.0, 0.5,		// maybe pnk
   
	0.5, 0.5, 0.0, 1.0,  1.0, 0.0, 0.0,	  // r  					
	0.5, 0.0, 0.0, 1.0,  1.0, 0.0, 0.0,	  // r 	
	0.0, 0.5, 0.0, 1.0,  1.0, 0.0, 1.0,		// prpl
	//front tri
	0.0, 0.0, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
	0.5, 0.0, 0.0, 1.0,     	1.0, 0.0, 0.0,	  // r
	0.25, 0.25, 0.25, 1.0,			1.0, 0.0, 1.0,		// prpl
	//back tri
	0.5, 0.5, 0.0, 1.0,  0.0, 0.0, 1.0,		// b					
	0.25, 0.25, 0.25, 1.0,  1.0, 0.0, 1.0,		// prpl	
	0.0, 0.5, 0.0, 1.0,   1.0, 0.0, 0.0,	  // r  
	// left tri
	0.0, 0.5, 0.0, 1.0,  0.0, 0.0, 1.0,		// b 					
	0.0, 0.0, 0.0, 1.0,  1.0, 0.0, 1.0,		// prpl	  	
	0.25, 0.25, 0.25, 1.0,  1.0, 0.0, 0.0,	  // r
	// right tri
	0.5, 0.0, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
	0.25, 0.25, 0.25, 1.0,     	1.0, 0.0, 0.0,	  // r
	0.5, 0.5, 0.0, 1.0,			1.0, 0.0, 1.0,		// prpl
	]);
}
function makeDiamond() {
//==============================================================================
// Make a diamond-like shape from two adjacent tetrahedra, aligned with Z axis.

	// YOU write this one...
	
}

function makePyramid() {
//==============================================================================
// Make a 4-cornered pyramid from one OpenGL TRIANGLE_STRIP primitive.
// All vertex coords are +/1 or zero; pyramid base is in xy plane.

  	// YOU write this one...
}


function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var ctrColr = new Float32Array([0.2, 0.2, 0.2]);	// dark gray
 var topColr = new Float32Array([0.4, 0.7, 0.4]);	// light green
 var botColr = new Float32Array([0.5, 0.5, 1.0]);	// light blue
 var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
 var botRadius = 1.6;		// radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] = 1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
			cylVerts[j+4]=ctrColr[0]; 
			cylVerts[j+5]=ctrColr[1]; 
			cylVerts[j+6]=ctrColr[2];
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=topColr[0]; 
			cylVerts[j+5]=topColr[1]; 
			cylVerts[j+6]=topColr[2];			
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=topColr[0]; 
				cylVerts[j+5]=topColr[1]; 
				cylVerts[j+6]=topColr[2];			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] =-1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=botColr[0]; 
				cylVerts[j+5]=botColr[1]; 
				cylVerts[j+6]=botColr[2];			
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =-1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=botColr[0]; 
			cylVerts[j+5]=botColr[1]; 
			cylVerts[j+6]=botColr[2];		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] =-1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
			cylVerts[j+4]=botColr[0]; 
			cylVerts[j+5]=botColr[1]; 
			cylVerts[j+6]=botColr[2];
		}
	}
}

function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.

	// Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.
										
	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices; 
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;	
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;	
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = cos0;		
				sphVerts[j+3] = 1.0;			
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.		
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=topColr[0]; 
				sphVerts[j+5]=topColr[1]; 
				sphVerts[j+6]=topColr[2];	
				}
			else if(s==slices-1) {
				sphVerts[j+4]=botColr[0]; 
				sphVerts[j+5]=botColr[1]; 
				sphVerts[j+6]=botColr[2];	
			}
			else {
					sphVerts[j+4]=Math.random();// equColr[0]; 
					sphVerts[j+5]=Math.random();// equColr[1]; 
					sphVerts[j+6]=Math.random();// equColr[2];					
			}
		}
	}
}

function makeTorus() {
//==============================================================================
// 		Create a torus centered at the origin that circles the z axis.  
// Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
// into a circle around the z-axis. The bent bar's centerline forms a circle
// entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
// bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
// around the z-axis in counter-clockwise (CCW) direction, consistent with our
// right-handed coordinate system.
// 		This bent bar forms a torus because the bar itself has a circular cross-
// section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
// around the bar's centerline, circling right-handed along the direction 
// forward from the bar's start at theta=0 towards its end at theta=2PI.
// 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
// a slight increase in phi moves that point in -z direction and a slight
// increase in theta moves that point in the +y direction.  
// To construct the torus, begin with the circle at the start of the bar:
//					xc = rbend + rbar*cos(phi); 
//					yc = 0; 
//					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
// and then rotate this circle around the z-axis by angle theta:
//					x = xc*cos(theta) - yc*sin(theta) 	
//					y = xc*sin(theta) + yc*cos(theta)
//					z = zc
// Simplify: yc==0, so
//					x = (rbend + rbar*cos(phi))*cos(theta)
//					y = (rbend + rbar*cos(phi))*sin(theta) 
//					z = -rbar*sin(phi)
// To construct a torus from a single triangle-strip, make a 'stepped spiral' 
// along the length of the bent bar; successive rings of constant-theta, using 
// the same design used for cylinder walls in 'makeCyl()' and for 'slices' in 
// makeSphere().  Unlike the cylinder and sphere, we have no 'special case' 
// for the first and last of these bar-encircling rings.
//
var rbend = 1.0;										// Radius of circle formed by torus' bent bar
var rbar = 0.5;											// radius of the bar we bent to form torus
var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 13;										// # of sides of the bar (and thus the 
																		// number of vertices in its cross-section)
																		// >=3 req'd;
																		// more sides for more-circular cross-section
// for nice-looking torus with approx square facets, 
//			--choose odd or prime#  for barSides, and
//			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
// EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.

	// Create a (global) array to hold this torus's vertices:
 torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
//	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
// triangle and last slice will skip its last triangle. To 'close' the torus,
// repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

var phi=0, theta=0;										// begin torus at angles 0,0
var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
																			// (WHY HALF? 2 vertices per step in phi)
	// s counts slices of the bar; v counts vertices within one slice; j counts
	// array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
																						 Math.cos((s)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.sin((s)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
																						 Math.cos((s+1)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.sin((s+1)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			torVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			torVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
			j+=7; // go to next vertex:
			torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
	}
}

function drawAll(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
   // DEFINE 'world-space' coords.

  function drawScene(projMatrix){

				
  pushMatrix(modelMatrix);     // SAVE world coord system;
    	//-------Draw Spinning Cylinder:
		cylAngle = animateCyl(cylAngle);

    modelMatrix.translate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV. 
    modelMatrix.scale(0.2, 0.2, 0.2);
    						// if you DON'T scale, cyl goes outside the CVV; clipped!
    modelMatrix.rotate(cylAngle, 1, 1, 1); 
  	// Drawing:
    // Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Draw the cylinder's vertices, and no other vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							cylStart/floatsPerVertex, // start at this vertex number, and
    							cylVerts.length/floatsPerVertex);	// draw this many vertices.
	modelMatrix.translate(0, 0, 1);
	modelMatrix.scale(1,1,3);
	modelMatrix.rotate(2 * cylAngle, 1, 1, 1); 
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
		modelMatrix.translate(0, 0, 0.5);
		modelMatrix.rotate(4 * cylAngle, 1, 1, 1);
		gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
RectPrismVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //===========================================================
  //  
  pushMatrix(modelMatrix);  // SAVE world drawing coords.
    //--------Draw Spinning Sphere
    modelMatrix.translate( 1.4, -1.4, 0.25); // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV.
                          // to match WebGL display canvas.
    modelMatrix.scale(0.3, 0.3, 0.3);
	pushMatrix(modelMatrix);
    modelMatrix.rotate(2*currentAngle, 0, 1, 0);
    modelMatrix.translate(1, -2, 0);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	// Draw just the sphere's vertices
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
						sphStart/floatsPerVertex,	// start at this vertex number, and 
						sphVerts.length/floatsPerVertex);	

	modelMatrix.translate(-1, -1.25, 0);
	modelMatrix.rotate(4*currentAngle, 0, 1, 0);

	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	// Draw just the sphere's vertices
	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
						sphStart/floatsPerVertex,	// start at this vertex number, and 
						sphVerts.length/floatsPerVertex);	
						modelMatrix.rotate(currentAngle, 1, 1, 0);

	  modelMatrix.translate(1.2, -0.5, 0);
	  modelMatrix.rotate(8*currentAngle, 0, 1, 0);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  // Draw just the sphere's vertices
	  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
						sphStart/floatsPerVertex,	// start at this vertex number, and 
						sphVerts.length/floatsPerVertex);							
    						// Make it smaller:
      modelMatrix = popMatrix();

	  quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix
	  modelMatrix.concat(quatMatrix);


    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    		// Draw just the sphere's vertices
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							sphStart/floatsPerVertex,	// start at this vertex number, and 
    							sphVerts.length/floatsPerVertex);	// draw this many vertices.
  	modelMatrix.scale(5,5,5/6);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.LINES, AxesStart/floatsPerVertex,	// start at this vertex number, and
		AxesVerts.length/floatsPerVertex);
	modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  
  //===========================================================
  //  
  pushMatrix(modelMatrix);  // SAVE world drawing coords.
  //--------Draw Spinning torus
    shakerHeight = animateShaker(shakerHeight);
    modelMatrix.translate(-0.4, 1.4, 0.4);	// 'set' means DISCARD old matrix,
  
    modelMatrix.scale(0.3, 0.3, 0.3);
	modelMatrix.translate(0, shakerHeight*0.5, 0);	// 'set' means DISCARD old matrix,
    						// Make it smaller:
    modelMatrix.rotate(90, 1, 0, 0);  // Spin on YZ axis
  	// Drawing:		
  	// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    		//  just the torus's vertices
	modelMatrix.translate(-0.25,0.8,-0.15);
	modelMatrix.rotate(90, 1, 0, 0);
	modelMatrix.scale(1, 1, 3);
    gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
    						  torStart/floatsPerVertex,	// start at this vertex number, and
    						  torVerts.length/floatsPerVertex);	// draw this many vertices.
	modelMatrix.translate(0, -shakerHeight, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
    RectPrismVerts.length/floatsPerVertex);
	modelMatrix.scale(5,5,5/6);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.LINES, AxesStart/floatsPerVertex,	// start at this vertex number, and
		AxesVerts.length/floatsPerVertex);
  modelMatrix = popMatrix();  // RESTORE 'world' drawing coords. 
 
 
 
  //===========================================================
  //
  pushMatrix(modelMatrix);  // SAVE world drawing coords.
  	//---------Draw Ground Plane, without spinning.
  	// position it.
  	modelMatrix.translate(0.4, -0.4, 0.0);	
  	modelMatrix.scale(0.1, 0.1, 0.1);				// shrink by 10X:

  	// Drawing:
  	// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Draw just the ground-plane's vertices
    gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
    						  gndStart/floatsPerVertex,	// start at this vertex number, and
    						  gndVerts.length/floatsPerVertex);	// draw this many vertices.

	modelMatrix.scale(30,30,30);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.LINES, AxesStart/floatsPerVertex,	// start at this vertex number, and
		AxesVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //===========================================================
  ///////////////////////////////////////////////////////////////////////CRANE
  pushMatrix(modelMatrix);
  lowerCraneArmAngle = animateCrane(lowerCraneArmAngle);
  //==============================================================================
	// Clear <canvas>  colors AND the depth buffer
   //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
  // Great question from student:
  // "?How can I get the screen-clearing color (or any of the many other state
  //		variables of OpenGL)?  'glGet()' doesn't seem to work..."
  // ANSWER: from WebGL specification page: 
  //							https://www.khronos.org/registry/webgl/specs/1.0/
  //	search for 'glGet()' (ctrl-f) yields:
  //  OpenGL's 'glGet()' becomes WebGL's 'getParameter()'
  
  ///	clrColr = new Float32Array(4);
  ///	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	  // console.log("clear value:", clrColr);
  
  
	  //--------Draw NON spinning triangle
  ///	modelMatrix.setTranslate(0.25,0.25,0);
		  //Use this matrix to transform & draw 
	//    	the first set of vertices stored in our VBO:
			//Pass our current matrix to the vertex shaders:
	  //-----------------------------------------
  //AHHHHHHHHHHHHHHHHHHHHHHHH
  
	  //upper arm
	  modelMatrix.scale(0.75, 0.125, 0.125); 
	  modelMatrix.translate(1.3, 0.3, 3.5);
	  modelMatrix.rotate(90, 1, 0, 0);

	  modelMatrix.rotate(lowerCraneArmAngle, 1, 0, 0);
	  
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		  RectPrismVerts.length/floatsPerVertex);
	  // lower arm
	  modelMatrix.scale(0.5, 1, 0.5); 
	  modelMatrix.translate(-0.50, 0, 0.25); 
	  modelMatrix.rotate(lowerCraneArmAngle*0.25, 1, 0, 0);
  
  
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		  RectPrismVerts.length/floatsPerVertex);
	  //string
	  //up and down arrow should move this y-val up and down
  
	  modelMatrix.scale(0.05, stringLength, 0.05); 
	  modelMatrix.translate(0, -0.5, 0); 
	  modelMatrix.rotate(lowerCraneArmAngle*0.125, 1, 0, 0);
  
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		  RectPrismVerts.length/floatsPerVertex);
  
	  
	  modelMatrix.translate(0, -0.01, 0.2); 
	  modelMatrix.scale(10, 0.125, 1); 
	  modelMatrix.rotate(lowerCraneArmAngle*1.5,1,0,0);
	  pushMatrix(modelMatrix);
	  modelMatrix.translate(-0.1775,0.18,-0.25);
	  modelMatrix.scale(0.7,0.175,0.5);
  
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, SpecPrt1Start/floatsPerVertex, 
		  SpecPrt1Verts.length/floatsPerVertex);	
  
		  
		  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, SpecPrt2Start/floatsPerVertex, 
		  SpecPrt2Verts.length/floatsPerVertex);
  
  
  
	  modelMatrix = popMatrix();
	  modelMatrix.rotate(90,0,1,0);
	  modelMatrix.scale(0.5,0.5,0.5);
	  modelMatrix.rotate(90,0,1,0);
	  modelMatrix.rotate(45,0,0,1);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, SpecPrt3Start/floatsPerVertex, 
		  SpecPrt3Verts.length/floatsPerVertex);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, SpecPrt4Start/floatsPerVertex, 
		  SpecPrt4Verts.length/floatsPerVertex);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  
	  gl.drawArrays(gl.TRIANGLES, SpecPrt5Start/floatsPerVertex, 
		  SpecPrt5Verts.length/floatsPerVertex);
	  modelMatrix.translate(0.125,0.125,0);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, SpecPrt6Start/floatsPerVertex, 
		  SpecPrt6Verts.length/floatsPerVertex);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, SpecPrt7Start/floatsPerVertex, 
		  SpecPrt7Verts.length/floatsPerVertex);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLES, SpecPrt8Start/floatsPerVertex, 
		  SpecPrt8Verts.length/floatsPerVertex);
  
    modelMatrix = popMatrix();
    
	//////////////////////////////////////////////////////////////////////BUTTERFLY
	pushMatrix(modelMatrix);
	butterflyHeight = animateButterfly(butterflyHeight, butterflyRotateAngle);
	


	modelMatrix.translate(2, 0, 0.3);	
	modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.25, 0.25, 0.25);
	modelMatrix.rotate(butterflyRotateAngle, 0, 1, 0); //tryna make it rotate and fly
  
	modelMatrix.translate(0, butterflyHeight, 0);
   
	pushMatrix(modelMatrix);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	 gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
	//butterfly abdomen
	modelMatrix = popMatrix();
	 
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, AbdomenStart/floatsPerVertex, 
		AbdomenVerts.length/floatsPerVertex);
  
	pushMatrix(modelMatrix);
  
  
	//butterfly leg # 1
	modelMatrix.scale(0.05, 0.9, 0.05); 
	modelMatrix.translate(0, -0.5, 0); 
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
  
	//butterfly leg # 2
	modelMatrix.translate(2, 0, 5); 
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
  
	//butterfly leg # 3
	modelMatrix.translate(-2, 0, 5); 
	
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
  
	//butterfly leg # 4
	modelMatrix.translate(9, 0, 0); 
	 
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
  
	//butterfly leg # 5
	modelMatrix.translate(-2, 0, -5); 
		 
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
  
	//butterfly leg # 6
	modelMatrix.translate(2, 0, -5); 
	 
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
  
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
  
  
  
	wingAngle = animateWings(wingAngle);
  
  
  
	modelMatrix.rotate(wingAngle, 0, 0, 1);
	modelMatrix.translate(0.5,0,0.125);
	modelMatrix.scale(0.25,0.25,0.5);
	
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
	//left middle wing
	modelMatrix.rotate(wingAngle*1.2, 0, 0, 1);
	modelMatrix.translate(0.125,0.5, -0.15);
	modelMatrix.scale(2,1.25,1.5);
	
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
	//left main wing
	modelMatrix.rotate(wingAngle*1.5, 0, 0, 1);
	modelMatrix.translate(0.125,0.5, -0.15);
	modelMatrix.scale(2,1.25,1.5);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
	//left top wing
	modelMatrix.rotate(wingAngle*1.7, 0, 0, 1);
	modelMatrix.translate(0.125,0.5, -0.15);
	modelMatrix.scale(2,1.25,1.5);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
  
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
	//right underwing/tendon
	modelMatrix.rotate(-wingAngle, 0, 0, 1);
	modelMatrix.translate(-0.125, 0, 0.15); 
	modelMatrix.scale(0.25,0.25,0.5);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
	
	//right middle wing
	modelMatrix.rotate(-wingAngle * 1.2, 0, 0, 1);
	modelMatrix.translate(-0.625,0.5, -0.15);
	modelMatrix.scale(2,1.25,1.5);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
	//right main wing
	modelMatrix.rotate(-wingAngle * 1.5, 0, 0, 1);
	modelMatrix.translate(-0.625,0.5, -0.15);
	modelMatrix.scale(2,1.25,1.5);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
		pushMatrix(modelMatrix);
      modelMatrix.scale(5, 5, 5);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.LINES, AxesStart/floatsPerVertex,	// start at this vertex number, and
	  AxesVerts.length/floatsPerVertex);
	  modelMatrix = popMatrix();
	//right top wing
	modelMatrix.rotate(-wingAngle * 1.7, 0, 0, 1);
	modelMatrix.translate(-0.625,0.5, -0.15);
	modelMatrix.scale(2,1.25,1.5);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, RectPrismStart/floatsPerVertex, 
		RectPrismVerts.length/floatsPerVertex);
	var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
							// why add 0.001? avoids divide-by-zero in next statement
							// in cases where user didn't drag the mouse.)
	modelMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);
	//first eye
	modelMatrix = popMatrix();
	modelMatrix.translate(0.075,0.25,0.05);
	modelMatrix.scale(0.25,0.25,0.25);
	pushMatrix(modelMatrix);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex); 	
  
	modelMatrix.rotate(180, 1, 0, 0);
	modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);	
  
	modelMatrix.rotate(90, 1, 0, 0);
	modelMatrix.translate(0.0,-0.5,0);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);	
  
	modelMatrix.rotate(180, 1, 0, 0);
	modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);	
  
	modelMatrix.rotate(90, 0, 1, 0);
	modelMatrix.translate(0,0,0.5);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);	
  
	modelMatrix.rotate(180, 1, 0, 0);
	modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);
  
	///second eye
  
	modelMatrix.translate(0,0,-1);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);	
  
	modelMatrix.rotate(180, 1, 0, 0);
	modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);	
  
	modelMatrix.rotate(90, 1, 0, 0);
	modelMatrix.translate(0.0,-0.5,0);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);	
  
	modelMatrix.rotate(180, 1, 0, 0);
	modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);	
  
	modelMatrix.rotate(90, 0, 1, 0);
	modelMatrix.translate(0,0,0.5);
  
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);	
  
	modelMatrix.rotate(180, 1, 0, 0);
	modelMatrix.translate(0.0,-0.5,0.5);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, CmpndEyesStart/floatsPerVertex, 
		CmpndEyesVerts.length/floatsPerVertex);
	}
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	modelMatrix.setIdentity(); 
	var vpAspect = canvas.width/(canvas.height);
	g_far =+25.0
	g_near = +1.0;	
	projMatrix = modelMatrix.perspective(35.0, vpAspect, g_near , g_far);
	modelMatrix.lookAt( g_EyeX, g_EyeY, g_EyeZ,	
		g_EyeX + Math.cos(theta), g_EyeY + Math.sin(theta), g_EyeZ + deltaZ,	
						  0, 0, 1);
	gl.viewport(0, 0, canvas.width/2, canvas.height);			// viewport height in pixels.
  
	drawScene(projMatrix);
	modelMatrix.setIdentity(); 
	console.log("----------------------------------------------------");
	//(gfar - gnear)/3 times the tangent of field of view divided by 2
	orthoMatrix = modelMatrix.ortho(-2.522392 * vpAspect, 2.522392 *vpAspect, -2.522392 , 2.522392 ,g_near, g_far);
	
	modelMatrix.lookAt( g_EyeX, g_EyeY, g_EyeZ,	
		g_EyeX + Math.cos(theta), g_EyeY + Math.sin(theta), g_EyeZ + deltaZ,	
						  0, 0, 1);
	gl.viewport(canvas.width/2, 0, canvas.width/2, canvas.height);			// viewport height in pixels.

  
	drawScene(orthoMatrix);
  
}


// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;    
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function animateCrane(angle) {
	//==============================================================================
	  // Calculate the elapsed time
	  var now = Date.now();
	  var elapsed = now - g_last;
	  g_last = now;
	
	  var newAngle = angle + (lowerCraneArmAngleRate * elapsed) / 1000.0;
	//  if(newAngle > 60.0 || newAngle <-60.0){ 
	//	lowerCraneArmAngleRate = -lowerCraneArmAngleRate;
	  //}
	  if(((newAngle > 60.0)  && (lowerCraneArmAngleRate > 0)) || ((newAngle < -60.0)  && (lowerCraneArmAngleRate < 0))){
		lowerCraneArmAngleRate= -lowerCraneArmAngleRate;
	  }
	  return newAngle;
	  
	}
	

function animateButterfly(height, angle) {
	//==============================================================================
	  // Calculate the elapsed time
	  var now = Date.now();
	  var elapsed = now - g_last;
	  g_last = now;
      var newAngle = angle + (butterflyRotateAngleRate * elapsed) / 1000.0;
	  var newHeight = height + (flySpeedChangeRate * elapsed) / 1000.0;
   //  if(newHeight > 0.5 || newHeight <-0.5){
	//	  flySpeedChangeRate= 0-flySpeedChangeRate;
	  //}
	  if(((newHeight > 0.5)  && (flySpeedChangeRate > 0)) || ((newHeight < -0.5)  && (flySpeedChangeRate < 0))){
		flySpeedChangeRate= -flySpeedChangeRate;
	  }
//	  if(newAngle >45 || newAngle <-45){
//		  butterflyRotateAngleRate = -butterflyRotateAngleRate;
          
//	  }	  
	  if(((newAngle > 45)  && (butterflyRotateAngleRate > 0)) || ((newAngle < -45)  && (butterflyRotateAngleRate < 0))){
		butterflyRotateAngleRate = -butterflyRotateAngleRate;
	  }
      butterflyRotateAngle = newAngle;
	  return newHeight;
	}
function animateWings(angle) {
		//==============================================================================
		  // Calculate the elapsed time
		  var now = Date.now();
		  var elapsed = now - g_last;
		  g_last = now;
		  		
		  var newAngle = angle + (wingAngleRate * elapsed) / 1000.0;
	//	  if(newAngle > 10.0 || newAngle <-10.0){ 
	//		wingAngleRate = -wingAngleRate;
	//	  }
		  if(((newAngle > 10.0)  && (wingAngleRate > 0)) || ((newAngle < -10.0)  && (wingAngleRate < 0))){
			wingAngleRate = -wingAngleRate;
		  }
		  return newAngle;

		}

function animateShaker(height) {
	//==============================================================================
		// Calculate the elapsed time
		var now = Date.now();
		var elapsed = now - g_last;
		g_last = now;
				
		var newHeight = height + (shakerHeightRate * elapsed) / 1000.0;
		if(((newHeight > 0.25)  && (shakerHeightRate > 0)) || ((newHeight < 0)  && (shakerHeightRate < 0))){
		shakerHeightRate = -shakerHeightRate;
		}
		return newHeight;

	}

	function animateCyl(angle) {
		//==============================================================================
		  // Calculate the elapsed time
		  var now = Date.now();
		  var elapsed = now - g_last;
		  g_last = now;
		  		
		  var newAngle = angle + (cylAngleRate * elapsed) / 1000.0;
	//	  if(newAngle > 10.0 || newAngle <-10.0){ 
	//		wingAngleRate = -wingAngleRate;
	//	  }
		  if(((newAngle > 85.0)  && (cylAngleRate > 0)) || ((newAngle < -85.0)  && (cylAngleRate < 0))){
			cylAngleRate = -cylAngleRate;
		  }
		  return newAngle;

		}

function drawResize() {
	//==============================================================================
	// Called when user re-sizes their browser window , because our HTML file
	// contains:  <body onload="main()" onresize="winResize()">
	
		//Report our current browser-window contents:
	
		
		//Make canvas fill the top 70% of our browser window:
		var xtraMargin = 30;    // keep a margin (otherwise, browser adds scroll-bars)
		canvas.width = innerWidth - xtraMargin;
		canvas.height = (innerHeight*7/10) - xtraMargin;
		// IMPORTANT!  Need a fresh drawing in the re-sized viewports.
						// draw in all viewports.
	}






		

//==================HTML Button Callbacks
function nextShape() {
	shapeNum += 1;
	if(shapeNum >= shapeMax) shapeNum = 0;
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function spinUp() {
  ANGLE_STEP += 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}

function myMouseDown(ev, gl, canvas) {
	//==============================================================================
	// Called when user PRESSES down any mouse button;
	// 									(Which button?    console.log('ev.button='+ev.button);   )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
	console.log(isDrag); 

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
	  
		// Convert to Canonical View Volume (CVV) coordinates too:
	  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
							   (canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
								 (canvas.height/2);
	//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
		
		isDrag = true;											// set our mouse-dragging flag
		xMclik = x;													// record where mouse-dragging began
		yMclik = y;
	};

function myMouseMove(ev, gl, canvas) {
	//==============================================================================
	// Called when user MOVES the mouse with a button already pressed down.
	// 									(Which button?   console.log('ev.button='+ev.button);    )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
	
		if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'
	 
		// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
	  
		// Convert to Canonical View Volume (CVV) coordinates too:
	  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
							   (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
								 (canvas.height/2);
	//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);
	    
		// find how far we dragged the mouse:
	    xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
		yMdragTot += (y - yMclik);
		// Report new mouse position & how far we moved on webpage:
		dragQuat(x - xMclik, y - yMclik);

		if (((x < 1) && (x>-1)) && ((y<1) && (y>-1))){
		xMclik = x;													// Make next drag-measurement from here.
		yMclik = y;
		}
		
		//theta = -xMclik;
		
		//deltaZ = yMclik *0.1;
	};

	function myMouseUp(ev, gl, canvas) {
		//==============================================================================
		// Called when user RELEASES mouse button pressed previously.
		// 									(Which button?   console.log('ev.button='+ev.button);    )
		// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
		//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
		
		// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
		  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
		  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
		  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
		//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
		  
			// Convert to Canonical View Volume (CVV) coordinates too:
		  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
								   (canvas.width/2);			// normalize canvas to -1 <= x < +1,
		  var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
									 (canvas.height/2);
		//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
			
			isDrag = false;											// CLEAR our mouse-dragging flag, and
			// accumulate any final bit of mouse-dragging we did:
			xMdragTot += (x - xMclik);
			yMdragTot += (y - yMclik);
		//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
		
			// AND use any mouse-dragging we found to update quaternions qNew and qTot;
			dragQuat(x - xMclik, y - yMclik);
		
			// Show it on our webpage, in the <div> element named 'MouseText':	
		};

function dragQuat(xdrag, ydrag) {
		var res = 5;
		var qTmp = new Quaternion(0,0,0,1);
		var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);


		qNew.setFromAxisAngle(-ydrag +0.0001, xdrag +0.0001, 0.0, dist*150.0)
		
		//qNew.setFromAxisAngle(-ydrag +0.0001, xdrag +0.0001, 0.0, dist*150.0)
        
		qTmp.multiply(qNew, qTot);			// apply new rotation to current rotation. 

	 	qTmp.normalize();						// normalize to ensure we stay at length==1.0.
		qTot.copy(qTmp);
		// show the new quaternion qTot on our webpage in the <div> element 'QuatValue'
	};

function myKeyDown(kev) {
	switch(kev.code) {
		case "KeyA":
			console.log('A');
			g_EyeY += Math.cos(theta)*0.1;
			g_EyeX += (-1*Math.sin(theta))*0.1; 
			break;
		case "KeyD":
			console.log('D');
			g_EyeY -= Math.cos(theta)*0.1;
			g_EyeX -= (-1*Math.sin(theta))*0.1;
			break;
		case "KeyW":
			console.log('W');
            g_EyeY += Math.sin(theta)*0.1;
			g_EyeX += Math.cos(theta)*0.1; 
			g_EyeZ += deltaZ*0.1;
			break;
		case "KeyS":
			console.log('S');
            g_EyeY -= Math.sin(theta)*0.1;
			g_EyeX -= Math.cos(theta)*0.1;
			g_EyeZ -= deltaZ*0.1;
			break;
	//	(cos(theta)*0 - sin(theta)*0)
		case "ArrowLeft": 	
		    theta += 0.1;
		/*	console.log(' left-arrow.');
			g_EyeY += Math.cos(theta)*0.1;
			g_EyeX += (-1*Math.sin(theta))*0.1; */			
			break;

		case "ArrowRight":
			theta -= 0.1;
		/*	console.log('right-arrow.');
			g_EyeY -= Math.cos(theta)*0.1;
			g_EyeX -= (-1*Math.sin(theta))*0.1; */
  		break;
		case "ArrowUp":		
		    if(deltaZ < 0.45){
				console.log(g_EyeZ + deltaZ);
		    deltaZ += 0.01;
			}
		/*	console.log('   up-arrow.');
            g_EyeY += Math.sin(theta)*0.1;
			g_EyeX += Math.cos(theta)*0.1;
			g_EyeZ += deltaZ*0.1; */
			break;
		case "ArrowDown":

			if(deltaZ > -0.45){
				console.log(g_EyeZ + deltaZ);
				deltaZ -= 0.01;
				}
		/*	console.log(' down-arrow.');
            g_EyeY -= Math.sin(theta)*0.1;
			g_EyeX -= Math.cos(theta)*0.1;
			g_EyeZ -= deltaZ*0.1; */
	}
}
 