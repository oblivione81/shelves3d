/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 16/11/12
 * Time: 12.38
 * To change this template use File | Settings | File Templates.
 */
//= require three
//= require ColladaLoader
//= require TrackballControl
//= require shelves



var env3d_scene, env3d_camera, env3d_renderer;

var env3d_model_environment;
var env3d_model_bookcase_template;
var env3d_model_bookcases = [];



//array of arrays of 3d models of books.
//An element at index i of this array is the list of all the books in the
//bookcase at slot i.
var env3d_model_books = [];
var env3d_model_shelves = [];
var env3d_bookcase_slots = [];     //list of {position, rotation}
var env3d_projector;
var env3d_animators;

var env3d_texture_pages;
//var __zoomedBookcaseIndex; //-1 no zoom
//var __highlightedBookcaseModel;


function env3d_init(elementId)
{
    rendering_canvas = document.getElementById(elementId);
    width = rendering_canvas.offsetWidth;
    height = rendering_canvas.offsetHeight;
    env3d_scene = new THREE.Scene();
    env3d_camera = new THREE.PerspectiveCamera(55, width/height, 1, 500);


    env3d_renderer = new THREE.WebGLRenderer({antialias:true, canvas:rendering_canvas});
    env3d_renderer.shadowMapEnabled = true;
    /*env3d_renderer.shadowMapSoft = true;

    env3d_renderer.shadowCameraNear = 3;
    env3d_renderer.shadowCameraFar = env3d_camera.far;
    env3d_renderer.shadowCameraFov = 50;

    env3d_renderer.shadowMapBias = 0.0039;
    env3d_renderer.shadowMapDarkness = 0.5;
    env3d_renderer.shadowMapWidth = 1024;
    env3d_renderer.shadowMapHeight = 1024;*/
    env3d_renderer.setSize(width, height);
    //div_rendering_canvas.appendChild(env3d_renderer.domElement);


    //---------------------------------------------------------
    //LIGTHS
    var directionalLight = new THREE.DirectionalLight( 0xFFD6AA, 1 );
    directionalLight.castShadow = true;
    directionalLight.position.set( -50, 180, 30 );
    directionalLight.target.position.set(-50, 60, 5);
    env3d_scene.add( directionalLight );
    directionalLight = new THREE.DirectionalLight( 0xFFD6AA, 1 );
    directionalLight.position.set( -70, 180, 30 );
    directionalLight.target.position.set(-50, 50, 5);
    env3d_scene.add( directionalLight );
    directionalLight = new THREE.DirectionalLight( 0xFFD6AA, 1 );
    directionalLight.position.set( -30, 180, 30 );
    directionalLight.target.position.set(-50, 50, 5);
    env3d_scene.add( directionalLight );

    //----------------------------------------------------------
    //CAMERA
    env3d_camera.position.set(0, 0, 0);
    //env3d_camera.lookAt(new THREE.Vector3(-1, 0, 0));


    rendering_canvas.addEventListener( 'mousemove', __onDocumentMouseMove, false );
    document.addEventListener( 'resize', onWindowResize, false);
    rendering_canvas.addEventListener( 'mousedown', __onDocumentMouseDown, false);

    env3d_projector = new THREE.Projector();

    env3d_animators = new Array;

    idler = new AnimationTimer(10, idleBook, true);
    idler.start();
    env3d_animators.push(idler);

    env3d_texture_pages = THREE.ImageUtils.loadTexture("..//book_side_pages.jpg");
    /*
    highliter = new AnimationTimer(1, highlighterCallback, true);
    highliter.start();

    env3d_animators.push(highliter);
    */
    //__zoomedBookcaseIndex = -1;
}

function zoomOnBookcases()
{
    var bBox = computeObjectsBBox(env3d_model_bookcases);
    smartPlaceCamera(env3d_camera, bBox);
    env3d_camera.position.y += 10;
}

function placeOnBookcases(books_entries)
{
    var placedBooks = 0;

    while (placedBooks < books_entries.length)
    {
        var bookcaseIndex = addBookCaseToScene();

        if (bookcaseIndex < 0)
        {
            console.log("Out of bookcase slots! Placed:" + placedBooks);
            break;
        }
        else
        {
            placedBooks += placeOnABookcase(
                env3d_model_bookcases[bookcaseIndex],
                books_entries,
                env3d_model_shelves[bookcaseIndex],
                env3d_model_books[bookcaseIndex]);
        }
    }
    zoomOnBookcases();
}

function env3d_clear()
{
    for (var i = 0; i < env3d_model_bookcases.length; i++)
    {
        env3d_model_environment.remove(env3d_model_bookcases[i]);
    }

    env3d_model_bookcases.length = 0;
    env3d_model_books.length = 0;
    env3d_model_shelves.length = 0;
    //__zoomedBookcaseIndex = -1;
    __zoomedShelf = null;
    __highlightedShelf = null;
    __zoomedBook = null;
    __highlightedBook = null;
    $("#button_unZoom").remove();
}


//bbox must be in world space.
function smartPlaceCamera(camera, bbox)
{
    var midPoint = new THREE.Vector3();
    midPoint.x = (bbox.max.x + bbox.min.x) * 0.5;
    midPoint.y = (bbox.max.y + bbox.min.y) * 0.5;
    midPoint.z = (bbox.max.z + bbox.min.z) * 0.5;

    //compute the distance at which the whole bounding box is
    //visible with the current camera.
    fovRad = camera.fov / 180 * Math.PI;
    w = Math.abs(bbox.max.x - bbox.min.x);
    h = Math.abs(bbox.max.y - bbox.min.y);

    w = w + w / 10; // enlarge the view of a 5%
    h = h + h / 10; // enlarge the view of a 5%

    d = 0;
    if (w > h)
        d = 0.5 * w * (1 / Math.tan(fovRad * camera.aspect * 0.5));
    else
        d = 0.5 * h * (1 / Math.tan(fovRad  * 0.5));

    midPoint = env3d_model_environment.worldToLocal(midPoint);
    bbox.max = env3d_model_environment.worldToLocal(bbox.max);
    camera.position = midPoint.clone();
    camera.position.z = bbox.max.z + d;
    camera.position.y += 0;

    camera.lookAt(midPoint);
}

//returns the index in the array of the added bookcase
function addBookCaseToScene()
{
    //var new_bookcase = new THREE.Mesh(env3d_model_bookcase_template.geometry, env3d_model_bookcase_template.material);

    if (env3d_model_bookcases.length < env3d_bookcase_slots.length)
    {
        var new_bookcase = env3d_model_bookcase_template.clone();
        new_bookcase.name = "bookcase" + env3d_model_bookcases.length;
        new_bookcase.receiveShadow = true;
        new_bookcase.castShadow = true;

        for (var i = 0; i < env3d_model_bookcase_template.children.length; i++)
        {
         /*   var child = env3d_model_bookcase_template.children[i];
            var mesh = new THREE.Mesh(child.geometry, child.material);
            mesh.name = child.name;*/
            var clonedMesh = env3d_model_bookcase_template.children[i].clone();
            clonedMesh.castShadow = true;
            clonedMesh.receiveShadow = true;
            /*var clonedMaterial = clonedMesh.material.clone();
            clonedMesh.material = clonedMaterial;    */
            new_bookcase.add(clonedMesh);
        }

        var slot = env3d_bookcase_slots[env3d_model_bookcases.length];
        new_bookcase.position = slot.position;
        //new_bookcase.rotation.y = slot.rotation;
        env3d_model_environment.add(new_bookcase);
        env3d_model_bookcases.push(new_bookcase);
        env3d_model_books.push(new Array);
        env3d_model_shelves.push(new Array);

        var light = new THREE.SpotLight(0xFFD6AA, 1);
        light.position = slot.position.clone();
        //light.position.x = 5;
        //light.position.z =
        env3d_model_environment.updateMatrixWorld();
        env3d_model_environment.localToWorld(light.position);

        light.position.x += 20;
        light.position.y += 120;
        light.position.z += 60;



//        light.position.x -= 80;


        light.castShadow = true;
        light.target.position = new_bookcase.position.clone();
        light.target.position.y += 60;
        light.target.position.x += 20;

        env3d_model_environment.localToWorld(light.target.position);


        //light.target = target;
        light.shadowDarkness = 0.5;
        //env3d_scene.add(light);



        var pos = slot.position;
        pos.y -= 0;
        env3d_camera.lookAt(pos);

        return env3d_model_bookcases.length - 1;
    }

    return -1;
}


function loadEnvironmentModel(modelFileName, callback)
{
    var collada_loader = new THREE.ColladaLoader();
    collada_loader.options.convertUpAxis = true;

    collada_loader.load( modelFileName, function(load_result){
        env3d_model_environment = load_result.scene.getChildByName("environment", true);

        env3d_scene.add(env3d_model_environment);

        //search for the camera
        var camera = env3d_model_environment.getChildByName("camera0", true);
        if (camera)
        {
            camera.visible = false;
            env3d_model_environment.add(env3d_camera);
            env3d_camera.position = camera.position;
            env3d_camera.rotation.set(0, 0, 0);

            env3d_model_environment.updateMatrixWorld();

            var t = env3d_model_environment.worldToLocal(new THREE.Vector3(0, 0, 0));
            env3d_camera.lookAt(t);
        }
        var slot;
        var slot_index = 0;
        do
        {
            slot = env3d_model_environment.getChildByName("slot" + slot_index, true);
            if (slot)
            {
                slot.visible = false;
                env3d_bookcase_slots.push({position:slot.position, rotation:slot.rotation});
                slot_index++;
            }
        }while(slot);
        console.log("Slots found:" + slot_index);
        callback(load_result);
    });
}

function loadBookcaseTemplate(modelFileName, callback)
{
    var collada_loader = new THREE.ColladaLoader();
    collada_loader.options.convertUpAxis = true;

    collada_loader.load( modelFileName, function(load_result){
        env3d_model_bookcase_template = load_result.scene.getChildByName("a_bookcase", true);

        callback(load_result);
    });
}




//function onDocumentMouseDown( event )
//{
//    event.preventDefault();
//
//    var pos = fromScreenToRenderer(new THREE.Vector2(event.clientX, event.clientY), "div_rendering_canvas");
//
//    var pickedBook = pickBook(pos.x, pos.y);
//
//    if (pickedBook && pickedBook != env3d_current_picked_book)
//    {
//        if(env3d_current_picked_book) env3d_current_picked_book.position = env3d_current_picked_book_position;
//        env3d_current_picked_book = pickedBook;
//        env3d_current_picked_book_position = pickedBook.position.clone();
//
//        var bookcase = env3d_current_picked_book.parent;
//
//        cameraPosInBookCaseWorld = bookcase.worldToLocal(env3d_camera.matrixWorld.getPosition().clone());
//
//        var animator = new AnimationTimer(0.5, function(t)
//            {
//                if (t == 1.0)
//                {
//                    var indexToRemove = env3d_animators.indexOf(animator);
//                    env3d_animators.splice(indexToRemove, 1);
//                }
//
//                pickedBook.position = interpVector3(env3d_current_picked_book_position, cameraPosInBookCaseWorld, t);
//
//                clearLog();
//                logVector("From:", env3d_current_picked_book_position);
//                logVector("To:", cameraPosInBookCaseWorld);
//                logVector("Current:", pickedBook.position);
//            },
//            false);
//        animator.start();
//        env3d_animators.push(animator);
//    }
//}

//function onDocumentMouseDown( event )
//{
//    event.preventDefault();
//
//    var pos = fromScreenToRenderer(new THREE.Vector2(event.clientX, event.clientY), "div_rendering_canvas");
//
//    if (__zoomedBookcaseIndex == -1)
//    {
//        bookcaseIndex = pickBookcase(pos.x, pos.y);
//        __zoomedBookcaseIndex = bookcaseIndex;
//
//        bbox = computeObjectsBBox([env3d_model_bookcases[bookcaseIndex]]);
//        smartPlaceCamera(env3d_camera, bbox);
//    }
//    else
//    {
//        pickBook(pos.x, pos.y);
//    }
//}

//function onDocumentMouseMove( event )
//{
//    event.preventDefault();
//
//    var pos = fromScreenToRenderer(new THREE.Vector2(event.clientX, event.clientY), "div_rendering_canvas");
//
//    if (__zoomedShelf)
//    {
//        //pick a book
//    }
//    else
//    {
//        //pick a shelf
//
//    }
//
//    if (__zoomedBookcaseIndex == -1)
//    {
//        bookcase = null;
//        bookcaseIndex = pickBookcase(pos.x, pos.y);
//
//        if (bookcaseIndex != null)
//            bookcase = env3d_model_bookcases[bookcaseIndex];
//
//        if (bookcase != __highlightedBookcaseModel)
//        {
//            if (__highlightedBookcaseModel) __doDehighlightBookcase(__highlightedBookcaseModel);
//            if (bookcase) __doHighlightBookcase(bookcase);
//            __highlightedBookcaseModel = bookcase;
//        }
//    }
//    else
//    {
//        pickBook(pos.x, pos.y);
//    }
//}



function pickBook(x, y)
{
    if (env3d_model_books.length == 0)
        return null;

    var vector = new THREE.Vector3(x, y, 0.5);
    env3d_projector.unprojectVector(vector, env3d_camera);

    var cameraPos = env3d_camera.matrixWorld.getPosition().clone();
    vector.subSelf(cameraPos).normalize();

    var ray = new THREE.Ray(cameraPos, vector );
    var intersects = ray.intersectObjects( env3d_model_books[0]);

    if (intersects.length > 0)
    {
        return intersects[0].object;
    }
    else
        return null;
}


//function pickBookcase(x, y)
//{
//    if (env3d_model_bookcases.length == 0)
//        return null;
//
//    var vector = new THREE.Vector3(x, y, 0.5);
//    env3d_projector.unprojectVector(vector, env3d_camera);
//
//    var cameraPos = env3d_camera.matrixWorld.getPosition().clone();
//    vector.subSelf(cameraPos).normalize();
//
//    var ray = new THREE.Ray(cameraPos, vector );
//
//    for (var i = 0; i < env3d_model_bookcases.length; i++)
//    {
//        if (intersectBookcase(ray, env3d_model_bookcases[i]))
//        {
//            return i;
//        }
//    }
//    return null;
//}


function onWindowResize() {

    env3d_camera.aspect = window.innerWidth / window.innerHeight;
    env3d_camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function highlighterCallback(t)
{
    var RED = new THREE.Color(0xFF0000);
    var WHITE = new THREE.Color(0xFFFFFF);

    if (env3d_highlighted_model)
    {
        if (t <= 0.5)
        {
            env3d_highlighted_model.material.color = interpColor(RED, WHITE, t*2);
        }
        else
        {
            env3d_highlighted_model.material.color = interpColor(WHITE, RED, (t - 0.5)*2);
        }
    }
}

function idleBook(t)
{
    if (__zoomedBook)
    {
        var max = -Math.PI / 2.0 + Math.PI / 6.0;
        var min = -Math.PI / 2.0 - Math.PI / 6.0;

        if (t <= 0.5)
        {
            var u = t * 2;
            __zoomedBook.model.rotation.y = max * u + min * (1-u);
        }
        else
        {
            var u = (t - 0.5) * 2;
            __zoomedBook.model.rotation.y = min * u + max * (1-u);
        }
    }
}


function env3d_render()
{

    requestAnimationFrame(env3d_render);
    env3d_renderer.render(env3d_scene, env3d_camera);

    for (var i = 0; i < env3d_animators.length; i++)
        env3d_animators[i].update();
}

